const pool = require('../config/db');

const withTransaction = async (handler) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await handler(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    withTransaction
};
