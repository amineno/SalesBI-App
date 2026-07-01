const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const logger = require('../utils/logger');

const backupDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function performBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `salesbi_backup_${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    // Build mysqldump command
    // Note: Using environment variables directly in the command
    const command = `mysqldump -h ${env.dbHost} -u ${env.dbUser} -p${env.dbPassword} ${env.dbName} > "${filePath}"`;

    logger.info('Starting database backup...', { fileName });

    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error('Backup failed', { error: error.message, stderr });
            return;
        }
        
        logger.info('Backup completed successfully', { fileName, size: fs.statSync(filePath).size });
        
        // Retention Policy: Delete backups older than 7 days
        cleanOldBackups();
    });
}

function cleanOldBackups() {
    const files = fs.readdirSync(backupDir);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    files.forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            logger.info('Deleted old backup', { file });
        }
    });
}

// Run if called directly
if (require.main === module) {
    performBackup();
}

module.exports = performBackup;
