const { describe, it, expect, beforeEach, vi } = require('vitest');
const { createMockReq, createMockRes } = require('./testUtils');

const mockPoolQuery = vi.fn();
const mockConnectionQuery = vi.fn();
const mockWithTransaction = vi.fn(async (handler) => handler({ query: mockConnectionQuery }));
const mockInsertAuditLog = vi.fn();
const mockSignAccessToken = vi.fn(() => 'signed-token');

vi.mock('../config/db', () => ({
    query: mockPoolQuery
}));

vi.mock('../utils/db', () => ({
    withTransaction: mockWithTransaction
}));

vi.mock('../utils/audit', () => ({
    insertAuditLog: mockInsertAuditLog
}));

vi.mock('../utils/jwt', () => ({
    signAccessToken: mockSignAccessToken
}));

vi.mock('../config/env', () => ({
    nodeEnv: 'development',
    maxLoginAttempts: 5,
    accountLockMinutes: 15,
    resetTokenExpiresMinutes: 30
}));

const authController = require('../controllers/authController');

describe('authController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forces public registration to use the User role', async () => {
        mockConnectionQuery.mockImplementation(async (sql, params) => {
            if (sql.startsWith('SELECT id FROM users')) return [[]];
            if (sql.startsWith('SELECT id FROM roles')) return [[{ id: 2 }]];
            if (sql.includes('INSERT INTO users')) return [{ insertId: 55 }];
            if (sql.startsWith('INSERT INTO audit_logs')) return [{}];
            throw new Error(`Unexpected query: ${sql}`);
        });

        const req = createMockReq({
            body: {
                full_name: 'Test User',
                email: 'user@example.com',
                password: 'SecurePass1!',
                role_id: 1
            }
        });
        const res = createMockRes();

        await authController.register(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.body.userId).toBe(55);
        expect(mockConnectionQuery).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO users'),
            expect.arrayContaining(['Test User', 'user@example.com', expect.any(String), 2])
        );
    });

    it('signs tokens with the standardized jwt helper on successful login', async () => {
        mockPoolQuery
            .mockResolvedValueOnce([[
                {
                    id: 7,
                    full_name: 'Admin User',
                    email: 'admin@example.com',
                    password: '$2b$12$uGv4LyD4NteLoI0lp4rWuO4mW7x1YgnPZXoqBYwygJyI072QtdgQW',
                    role: 'Admin',
                    failed_login_attempts: 0,
                    locked_until: null
                }
            ]])
            .mockResolvedValueOnce([{}]);

        const req = createMockReq({
            body: { email: 'admin@example.com', password: 'Password123!' }
        });
        const res = createMockRes();

        await authController.login(req, res);

        expect(mockSignAccessToken).toHaveBeenCalledWith({ id: 7, role: 'Admin' });
        expect(res.body.token).toBe('signed-token');
        expect(res.body.user.role).toBe('Admin');
    });

    it('locks the account after repeated failed login attempts', async () => {
        const bcrypt = require('bcryptjs');
        vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

        mockPoolQuery
            .mockResolvedValueOnce([[
                {
                    id: 9,
                    email: 'locked@example.com',
                    password: 'hash',
                    role: 'User',
                    failed_login_attempts: 4,
                    locked_until: null
                }
            ]])
            .mockResolvedValueOnce([{}]);

        const req = createMockReq({
            body: { email: 'locked@example.com', password: 'WrongPass1!' }
        });
        const res = createMockRes();

        await authController.login(req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toContain('Account locked');
        expect(mockPoolQuery).toHaveBeenNthCalledWith(
            2,
            'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
            [0, expect.any(Date), 9]
        );
    });

    it('issues a development reset token for existing users', async () => {
        mockPoolQuery.mockResolvedValueOnce([[{ id: 3, email: 'user@example.com' }]]);
        mockConnectionQuery.mockResolvedValue([{}]);

        const req = createMockReq({ body: { email: 'user@example.com' } });
        const res = createMockRes();

        await authController.forgotPassword(req, res);

        expect(res.body.message).toContain('reset link has been issued');
        expect(res.body.resetToken).toBeTruthy();
        expect(mockWithTransaction).toHaveBeenCalled();
    });

    it('rejects invalid password reset tokens', async () => {
        mockConnectionQuery.mockResolvedValueOnce([[]]);
        const req = createMockReq({
            body: { token: 'x'.repeat(64), password: 'NewPassword1!' }
        });
        const res = createMockRes();

        await authController.resetPassword(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('invalid or expired');
    });
});
