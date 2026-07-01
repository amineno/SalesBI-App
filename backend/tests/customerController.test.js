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

const customerController = require('../controllers/customerController');

describe('customerController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates customers transactionally', async () => {
        mockConnectionQuery.mockResolvedValueOnce([{ insertId: 12 }]);
        const req = createMockReq({
            body: { full_name: 'Jane Doe', email: 'jane@example.com', phone: '123', company: 'ACME' }
        });
        const res = createMockRes();

        await customerController.createCustomer(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe(12);
    });

    it('updates customers transactionally', async () => {
        mockConnectionQuery.mockResolvedValue([{}]);
        const req = createMockReq({
            params: { id: '12' },
            body: { full_name: 'Jane Doe', email: 'jane@example.com', phone: '123', company: 'ACME' }
        });
        const res = createMockRes();

        await customerController.updateCustomer(req, res);

        expect(res.body.message).toContain('updated');
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });

    it('deletes customers transactionally', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([[{ full_name: 'Jane Doe', email: 'jane@example.com' }]])
            .mockResolvedValueOnce([{}]);
        const req = createMockReq({ params: { id: '12' } });
        const res = createMockRes();

        await customerController.deleteCustomer(req, res);

        expect(res.body.message).toContain('deleted');
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });
});
