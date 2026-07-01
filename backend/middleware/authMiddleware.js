const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

exports.protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        logger.warn('JWT verification failed', { error: err.message });
        return res.status(401).json({ error: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Super Admin bypasses everything
        if (req.user.role === 'Super Admin') return next();

        if (!roles.includes(req.user.role)) {
            logger.warn('Authorization denied', {
                role: req.user.role,
                allowedRoles: roles,
                path: req.path
            });
            return res.status(403).json({ 
                error: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

const pool = require('../config/db');

exports.checkPermission = (permissionCode) => {
    return async (req, res, next) => {
        // Super Admin bypasses everything
        if (req.user.role === 'Super Admin') return next();

        try {
            const [rows] = await pool.query(`
                SELECT p.code
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN roles r ON rp.role_id = r.id
                WHERE r.name = ? AND p.code = ?
            `, [req.user.role, permissionCode]);

            if (rows.length === 0) {
                logger.warn('Permission denied', {
                    userId: req.user.id,
                    role: req.user.role,
                    permission: permissionCode,
                    path: req.path
                });
                return res.status(403).json({ 
                    error: 'You do not have permission to perform this action' 
                });
            }

            next();
        } catch (err) {
            logger.error('Permission check failed', { error: err.message });
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
