const createMockReq = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    user: { id: 1, role: 'Admin' },
    ...overrides
});

const createMockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (payload) => {
        res.body = payload;
        return res;
    };
    return res;
};

module.exports = {
    createMockReq,
    createMockRes
};
