const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    port: env.dbPort || 3306,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds timeout for serverless environments
    ssl: {
        rejectUnauthorized: false
    }
});

const testConnection = async () => {
    const connection = await pool.getConnection();
    connection.release();
    logger.info('Database connection established');
};

const getDatabaseStatus = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.ping();
        return { status: 'UP' };
    } finally {
        connection.release();
    }
};

module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.getDatabaseStatus = getDatabaseStatus;
