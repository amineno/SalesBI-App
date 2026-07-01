const pool = require('../config/db');
const cache = require('../utils/cache');

exports.getSettings = async (req, res) => {
    try {
        const cacheKey = 'system:settings';
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(cached);

        const [rows] = await pool.query('SELECT setting_key, setting_value, category FROM settings');
        const settingsMap = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        await cache.set(cacheKey, settingsMap, 3600); // 1 hour

        res.json(settingsMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSettings = async (req, res) => {
    const settings = req.body; // { key: value }
    try {
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        }
        
        await cache.del('system:settings');
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
