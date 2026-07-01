const pool = require('../config/db');
const { getDateRange } = require('../utils/dateUtils');

exports.getLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, user = '', action = '', entity = '', range = 'all' } = req.query;
        const offset = (page - 1) * limit;
        const { start, end } = getDateRange(range);

        let query = `
            SELECT a.*, u.full_name as user_name, u.email as user_email
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (user) {
            query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
            queryParams.push(`%${user}%`, `%${user}%`);
        }

        if (action) {
            query += ' AND a.action = ?';
            queryParams.push(action);
        }

        if (entity) {
            query += ' AND a.table_affected = ?';
            queryParams.push(entity);
        }

        if (range !== 'all') {
            query += ' AND a.created_at BETWEEN ? AND ?';
            queryParams.push(start, end);
        }

        query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, queryParams);
        
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
        const total = countResult[0].total;

        res.json({
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
