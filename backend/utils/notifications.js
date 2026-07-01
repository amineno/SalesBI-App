const pool = require('../config/db');
const socketService = require('../services/socketService');

const createNotification = async (userId, type, message) => {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, ?, ?, FALSE)',
            [userId, type, message]
        );
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }

    // Real-time emission
    socketService.emitToUser(userId, 'notification:new', { type, message, timestamp: new Date() });
};

const notifyAdmins = async (type, message) => {
    try {
        const [admins] = await pool.query(
            'SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = "Admin"'
        );
        
        for (const admin of admins) {
            await createNotification(admin.id, type, message);
        }
    } catch (err) {
        console.error('Failed to notify admins:', err.message);
    }
};

module.exports = {
    createNotification,
    notifyAdmins
};
