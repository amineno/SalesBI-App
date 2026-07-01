const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const fileName = process.argv[2] || 'add_payments.sql';
        const sql = fs.readFileSync(path.join(__dirname, 'sql', fileName), 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim());
        
        for (const cmd of commands) {
            console.log('Executing:', cmd.trim());
            await pool.query(cmd);
        }
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

runMigration();
