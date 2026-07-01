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

const orderController = require('../controllers/orderController');

describe('orderController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates orders transactionally', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([{ insertId: 21 }])
            .mockResolvedValue([{}]);

        const req = createMockReq({
            body: {
                customer_id: 5,
                status: 'completed',
                items: [{ product_id: 9, quantity: 2, unit_price: 15 }]
            }
        });
        const res = createMockRes();

        await orderController.createOrder(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe(21);
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });

    it('returns 404 when updating a missing order status', async () => {
        mockConnectionQuery.mockResolvedValueOnce([[]]);
        const req = createMockReq({
            params: { id: '999' },
            body: { status: 'completed' }
        });
        const res = createMockRes();

        await orderController.updateOrderStatus(req, res);

        expect(res.statusCode).toBe(404);
    });

    it('deletes completed orders transactionally', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([[{ id: 21, customer_id: 5, total_amount: 30, status: 'completed' }]])
            .mockResolvedValueOnce([[{ product_id: 9, quantity: 2 }]])
            .mockResolvedValue([{}]);

        const req = createMockReq({ params: { id: '21' } });
        const res = createMockRes();

        await orderController.deleteOrder(req, res);

        expect(res.body.message).toContain('deleted');
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });
});
