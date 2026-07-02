const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const logger = require('../utils/logger');

class MigrationService {
    async runAll() {
        const sqlDir = path.join(__dirname, '../sql');
        const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
        const results = [];

        for (const file of files) {
            try {
                const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
                // Split by semicolon but ignore ones inside strings or comments (simple regex split)
                const commands = sql.split(/;(?=(?:[^']*'[^']*')*[^']*$)/).filter(cmd => cmd.trim());
                
                for (const cmd of commands) {
                    if (cmd.trim()) {
                        try {
                            await pool.query(cmd.trim());
                        } catch (cmdErr) {
                            // Ignore "Duplicate" errors, log others
                            if (!cmdErr.message.includes('Duplicate') && !cmdErr.message.includes('already exists')) {
                                logger.warn(`Command failed in ${file}: ${cmdErr.message}`);
                            }
                        }
                    }
                }
                
                results.push({ file, status: 'SUCCESS' });
                logger.info(`Migration successful: ${file}`);
            } catch (err) {
                results.push({ file, status: 'FAILED', error: err.message });
                logger.error(`Migration failed: ${file}`, { error: err.message });
            }
        }
        return results;
    }
}

module.exports = new MigrationService();
