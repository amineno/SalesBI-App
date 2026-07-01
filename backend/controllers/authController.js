const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const pool = require('../config/db');
const env = require('../config/env');
const { signAccessToken } = require('../utils/jwt');
const { withTransaction } = require('../utils/db');
const { insertAuditLog } = require('../utils/audit');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number');

const registerSchema = z.object({
    full_name: z.string().min(2),
    email: z.string().email(),
    password: passwordSchema
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

const forgotPasswordSchema = z.object({
    email: z.string().email()
});

const resetPasswordSchema = z.object({
    token: z.string().min(20),
    password: passwordSchema
});

const profileSchema = z.object({
    full_name: z.string().min(2),
    phone: z.string().optional().nullable()
});

const getRoleIdByName = async (executor, roleName) => {
    const [roles] = await executor.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);

    if (roles.length === 0) {
        throw new Error(`Role ${roleName} is not configured`);
    }

    return roles[0].id;
};

const buildSafeUser = (user) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role
});

const createPasswordResetToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return { token, tokenHash };
};

exports.register = async (req, res) => {
    try {
        const validated = registerSchema.parse(req.body);

        const result = await withTransaction(async (connection) => {
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [validated.email]);
            if (existing.length > 0) {
                return { conflict: true };
            }

            const userRoleId = await getRoleIdByName(connection, 'User');
            const hashedPassword = await bcrypt.hash(validated.password, 12);

            const [insertResult] = await connection.query(
                `INSERT INTO users (full_name, email, password, role_id) VALUES (?, ?, ?, ?)`,
                [validated.full_name, validated.email, hashedPassword, userRoleId]
            );
            await insertAuditLog(connection, {
                userId: insertResult.insertId,
                action: 'REGISTER_USER',
                table: 'users',
                snapshot: { id: insertResult.insertId, email: validated.email, role: 'User' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            // Automatically create a customer record for the enterprise founder
            await connection.query(
                `INSERT INTO customers (full_name, email, company, assigned_to) 
                VALUES (?, ?, 'SalesBI Enterprise', ?)`,
                [validated.full_name, validated.email, insertResult.insertId]
            );

            return { userId: insertResult.insertId };
        });

        if (result.conflict) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Send Welcome Email
        await emailService.sendWelcomeEmail({ full_name: validated.full_name, email: validated.email, id: result.userId });

        res.status(201).json({ message: 'User registered successfully', userId: result.userId });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(', ') });
        }

        logger.error('Registration failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const [users] = await pool.query(
            `SELECT u.*, r.name as role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;
        if (lockedUntil && lockedUntil > new Date()) {
            return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            try {
                const nextAttempts = Number(user.failed_login_attempts || 0) + 1;
                const shouldLock = nextAttempts >= env.maxLoginAttempts;
                const lockUntil = shouldLock ? new Date(Date.now() + (env.accountLockMinutes * 60 * 1000)) : null;

                await pool.query(
                    'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                    [shouldLock ? 0 : nextAttempts, lockUntil, user.id]
                );
            } catch (sqerr) {
                logger.warn('Failed to update security login attempts - probably missing columns');
            }

            return res.status(401).json({
                error: shouldLock ? 'Account locked due to repeated failed logins' : 'Invalid credentials'
            });
        }

        try {
            await pool.query(
                'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?',
                [user.id]
            );
        } catch (sqerr) {
            logger.warn('Failed to reset security login attempts - probably missing columns');
        }

        await insertAuditLog(pool, {
            userId: user.id,
            action: 'LOGIN',
            table: 'users',
            snapshot: { email: user.email },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        const token = signAccessToken({ id: user.id, role: user.role, email: user.email });

        res.json({
            token,
            user: buildSafeUser(user)
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(', ') });
        }

        logger.error('Login failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.json({ message: 'If the account exists, a reset link has been issued.' });
        }

        const user = users[0];
        const { token, tokenHash } = createPasswordResetToken();
        const expiresAt = new Date(Date.now() + (env.resetTokenExpiresMinutes * 60 * 1000));

        await withTransaction(async (connection) => {
            await connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
            await connection.query(
                'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [user.id, tokenHash, expiresAt]
            );

            await insertAuditLog(connection, {
                userId: user.id,
                action: 'REQUEST_PASSWORD_RESET',
                table: 'password_reset_tokens',
                snapshot: { email: user.email, expiresAt },
                ipAddress: req.ip
            });
        });

        const payload = { message: 'If the account exists, a reset link has been issued.' };

        // Send Reset Email
        const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
        await emailService.sendPasswordResetEmail(user, resetUrl);

        if (env.nodeEnv !== 'production') {
            payload.resetToken = token;
        }

        res.json(payload);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(', ') });
        }

        logger.error('Forgot password failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = resetPasswordSchema.parse(req.body);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const hashedPassword = await bcrypt.hash(password, 12);

        const updated = await withTransaction(async (connection) => {
            const [tokens] = await connection.query(
                `SELECT id, user_id
                FROM password_reset_tokens
                WHERE token_hash = ?
                    AND used_at IS NULL
                    AND expires_at > NOW()
                LIMIT 1`,
                [tokenHash]
            );

            if (tokens.length === 0) {
                return false;
            }

            const resetToken = tokens[0];

            await connection.query(
                `UPDATE users
                SET password = ?, failed_login_attempts = 0, locked_until = NULL, password_updated_at = NOW()
                WHERE id = ?`,
                [hashedPassword, resetToken.user_id]
            );

            await connection.query(
                'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
                [resetToken.id]
            );

            await insertAuditLog(connection, {
                userId: resetToken.user_id,
                action: 'RESET_PASSWORD',
                table: 'users',
                snapshot: { userId: resetToken.user_id },
                ipAddress: req.ip
            });

            return true;
        });

        if (!updated) {
            return res.status(400).json({ error: 'Reset token is invalid or expired' });
        }

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(', ') });
        }

        logger.error('Reset password failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT u.id, u.full_name, u.email, u.phone, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [req.user.id]
        );

        res.json(users[0]);
    } catch (err) {
        logger.error('Fetch current user failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = profileSchema.parse(req.body);

        await withTransaction(async (connection) => {
            await connection.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [full_name, phone, req.user.id]);

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'UPDATE_PROFILE',
                table: 'users',
                snapshot: { full_name },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'Profile updated' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(', ') });
        }

        logger.error('Update profile failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = z.object({
            currentPassword: z.string(),
            newPassword: passwordSchema
        }).parse(req.body);

        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        await withTransaction(async (connection) => {
            await connection.query(
                'UPDATE users SET password = ?, password_updated_at = NOW() WHERE id = ?',
                [hashedPassword, req.user.id]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'UPDATE_PASSWORD',
                table: 'users',
                snapshot: { userId: req.user.id },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues.map((issue) => issue.message).join(', ') });
        }

        logger.error('Update password failed', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
