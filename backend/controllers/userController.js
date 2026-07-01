const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { withTransaction } = require('../utils/db');
const { insertAuditLog } = require('../utils/audit');

const ensureRoleExists = async (executor, roleId) => {
    const [roles] = await executor.query('SELECT id, name FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
        throw new Error('Role not found');
    }

    return roles[0];
};

// @desc    Get all users
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.created_at, r.name as role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get all roles
// @route   GET /api/users/roles
exports.getRoles = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
exports.createUser = async (req, res) => {
    const { full_name, email, password, role_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const created = await withTransaction(async (connection) => {
            const role = await ensureRoleExists(connection, role_id);
            const [result] = await connection.query(
                `INSERT INTO users
                (full_name, email, password, role_id, failed_login_attempts, email_verified, password_updated_at)
                VALUES (?, ?, ?, ?, 0, FALSE, NOW())`,
                [full_name, email, hashedPassword, role.id]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'CREATE_USER',
                table: 'users',
                snapshot: { id: result.insertId, email, role_id: role.id, role: role.name },
                ipAddress: req.ip
            });

            return result.insertId;
        });

        res.status(201).json({ id: created, message: 'User created' });
    } catch (err) {
        res.status(err.message === 'Role not found' ? 400 : 500).json({ error: err.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, role_id } = req.body;
    try {
        await withTransaction(async (connection) => {
            const role = await ensureRoleExists(connection, role_id);

            await connection.query(
                'UPDATE users SET full_name = ?, email = ?, role_id = ? WHERE id = ?',
                [full_name, email, role.id, id]
            );

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'UPDATE_USER',
                table: 'users',
                snapshot: { id, full_name, email, role_id: role.id, role: role.name },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(err.message === 'Role not found' ? 400 : 500).json({ error: err.message });
    }
};

// @desc    Assign user role
// @route   PATCH /api/users/:id/role
exports.assignUserRole = async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;

    try {
        await withTransaction(async (connection) => {
            const role = await ensureRoleExists(connection, role_id);

            await connection.query('UPDATE users SET role_id = ? WHERE id = ?', [role.id, id]);

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'ASSIGN_USER_ROLE',
                table: 'users',
                snapshot: { id, role_id: role.id, role: role.name },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'User role updated' });
    } catch (err) {
        res.status(err.message === 'Role not found' ? 400 : 500).json({ error: err.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete yourself' });
    }
    try {
        await withTransaction(async (connection) => {
            await connection.query('DELETE FROM users WHERE id = ?', [id]);

            await insertAuditLog(connection, {
                userId: req.user.id,
                action: 'DELETE_USER',
                table: 'users',
                snapshot: { id },
                ipAddress: req.ip
            });
        });

        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
