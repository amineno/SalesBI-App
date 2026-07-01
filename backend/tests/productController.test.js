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

const productController = require('../controllers/productController');

describe('productController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a product transactionally', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([{ insertId: 10 }])
            .mockResolvedValueOnce([{}]);

        const req = createMockReq({
            body: {
                name: 'Keyboard',
                category: 'Electronics',
                price: 99,
                cost: 50,
                sku: 'KB-1',
                quantity: 5,
                low_stock_threshold: 2
            }
        });
        const res = createMockRes();

        await productController.createProduct(req, res);

        expect(mockWithTransaction).toHaveBeenCalled();
        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe(10);
    });

    it('updates a product transactionally', async () => {
        mockConnectionQuery.mockResolvedValue([{}]);
        const req = createMockReq({
            params: { id: '10' },
            body: {
                name: 'Keyboard Pro',
                category: 'Electronics',
                price: 129,
                cost: 70,
                sku: 'KB-1',
                quantity: 8,
                low_stock_threshold: 3
            }
        });
        const res = createMockRes();

        await productController.updateProduct(req, res);

        expect(res.body.message).toContain('updated');
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });

    it('deletes a product transactionally', async () => {
        mockConnectionQuery
            .mockResolvedValueOnce([[{ name: 'Keyboard', sku: 'KB-1' }]])
            .mockResolvedValueOnce([{}]);

        const req = createMockReq({ params: { id: '10' } });
        const res = createMockRes();

        await productController.deleteProduct(req, res);

        expect(res.body.message).toContain('deleted');
        expect(mockInsertAuditLog).toHaveBeenCalled();
    });
});
