const UAParser = require('ua-parser-js');

const insertAuditLog = async (executor, { 
    userId, 
    action, 
    table, 
    snapshot, 
    ipAddress = null, 
    userAgent = null,
    sessionId = null
}) => {
    let os = null;
    let device = null;

    if (userAgent) {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();
        os = result.os.name;
        device = result.device.type || 'desktop';
    }

    try {
        await executor.query(
            `INSERT INTO audit_logs 
            (user_id, action, table_affected, data_snapshot, ip_address, user_agent, os, device, session_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, 
                action, 
                table, 
                JSON.stringify(snapshot), 
                ipAddress, 
                userAgent ? userAgent.substring(0, 255) : null, 
                os, 
                device, 
                sessionId
            ]
        );
    } catch (err) {
        // Silently skip if table is missing or other audit log issues
        console.warn('Audit log insertion failed, skipping:', err.message);
    }
};

module.exports = {
    insertAuditLog
};
