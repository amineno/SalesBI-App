const { describe, it, expect, beforeEach, vi } = require('vitest');
const { createMockReq, createMockRes } = require('./testUtils');

const mockVerifyAccessToken = vi.fn();

vi.mock('../utils/jwt', () => ({
    verifyAccessToken: mockVerifyAccessToken
}));

vi.mock('../utils/logger', () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
}));

const { protect, authorize } = require('../middleware/authMiddleware');

describe('authMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects requests without bearer tokens', () => {
        const req = createMockReq({ headers: {} });
        const res = createMockRes();
        const next = vi.fn();

        protect(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches the decoded user to authorized requests', () => {
        mockVerifyAccessToken.mockReturnValueOnce({ id: 1, role: 'Admin' });
        const req = createMockReq({
            headers: { authorization: 'Bearer valid-token' }
        });
        const res = createMockRes();
        const next = vi.fn();

        protect(req, res, next);

        expect(req.user.role).toBe('Admin');
        expect(next).toHaveBeenCalled();
    });

    it('blocks roles that are not authorized', () => {
        const req = createMockReq({ user: { id: 2, role: 'User' } });
        const res = createMockRes();
        const next = vi.fn();

        authorize('Admin')(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });
});
