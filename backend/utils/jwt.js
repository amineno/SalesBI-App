const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (payload) => jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: env.jwtIssuer
});

const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer
});

module.exports = {
    signAccessToken,
    verifyAccessToken
};
