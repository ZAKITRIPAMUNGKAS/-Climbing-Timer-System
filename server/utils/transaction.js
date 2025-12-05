/**
 * Database Transaction Utilities
 * Provides helper functions for MySQL transactions with proper error handling
 */

/**
 * Execute a function within a database transaction
 * @param {Function} callback - Async function that receives a connection object
 * @returns {Promise} Result from callback
 */
async function withTransaction(pool, callback) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Execute callback with connection
        const result = await callback(connection);
        
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        console.error('[TRANSACTION] Rollback due to error:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Execute a query within a transaction
 * @param {Object} connection - MySQL connection from pool.getConnection()
 * @param {String} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function executeQuery(connection, query, params = []) {
    const [result] = await connection.execute(query, params);
    return result;
}

module.exports = {
    withTransaction,
    executeQuery
};

