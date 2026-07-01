const { describe, it, expect, beforeEach, vi } = require('vitest');
const { createMockReq, createMockRes } = require('./testUtils');

const mockPoolQuery = vi.fn();
const mockConnectionQuery = vi.fn();
const mockWithTransaction = vi.fn(async (handler) => handler({ query: mockConnectionQuery }));
const mockInsertAuditLog = vi.fn();

vi.mock('../config/db', () => ({
    query: mockPoolQuery
}));

vi.mock('../utils/db', () => ({
    withTransaction: mockWithTransaction
}));

vi.mock('../utils/audit', () => ({
    insertAuditLog: mockInsertAuditLog
}));

const userController = require('../controllers/userController');

describe('userController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates admin-managed users transactionally', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([[{ id: 2, name: 'User' }]])
            .mockResolvedValueOnce([{ insertId: 44 }])
            .mockResolvedValue([{}]);

        const req = createMockReq({
            body: {
                full_name: 'Ops User',
                email: 'ops@example.com',
                password: 'StrongPass1!',
                role_id: 2
            }
        });
        const res = createMockRes();

        await userController.createUser(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe(44);
    });

    it('supports dedicated admin role assignment', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([[{ id: 1, name: 'Admin' }]])
            .mockResolvedValue([{}]);

        const req = createMockReq({
            params: { id: '44' },
            body: { role_id: 1 }
        });
        const res = createMockRes();

        await userController.assignUserRole(req, res);

        expect(res.body.message).toContain('role updated');
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });

    it('prevents deleting the current admin user', async () => {
        const req = createMockReq({
            params: { id: '1' },
            user: { id: 1, role: 'Admin' }
        });
        const res = createMockRes();

        await userController.deleteUser(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('cannot delete yourself');
    });
});
