const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        if (isAdmin) {
            query += ' OR user_id IS NULL';
        }
        query += ' ORDER BY created_at DESC LIMIT 50';

        const [rows] = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND (user_id = ?';
        if (isAdmin) {
            query += ' OR user_id IS NULL';
        }
        query += ')';

        await pool.query(query, [id, req.user.id]);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearAll = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = 'DELETE FROM notifications WHERE user_id = ?';
        if (isAdmin) {
            query += ' OR user_id IS NULL';
        }
        await pool.query(query, [req.user.id]);
        res.json({ message: 'Notifications cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = 'UPDATE notifications SET is_read = TRUE WHERE user_id = ?';
        if (isAdmin) {
            query += ' OR user_id IS NULL';
        }
        await pool.query(query, [req.user.id]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin', 'Manager'].includes(req.user.role);
        let query = 'SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE AND (user_id = ?';
        if (isAdmin) {
            query += ' OR user_id IS NULL';
        }
        query += ')';

        const [rows] = await pool.query(query, [req.user.id]);
        res.json({ count: rows[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
