/**
 * Pagination Utility
 * Helper functions for paginating database queries and responses
 */

/**
 * Get pagination parameters from request
 * @param {Object} req - Express request object
 * @param {Object} defaults - Default values
 * @returns {Object} Pagination parameters
 */
function getPaginationParams(req, defaults = {}) {
    const page = Math.max(1, parseInt(req.query.page) || defaults.page || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaults.limit || 20));
    const offset = (page - 1) * limit;

    return {
        page,
        limit,
        offset
    };
}

/**
 * Create paginated response
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Paginated response
 */
function createPaginatedResponse(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
}

/**
 * Get total count for pagination
 * @param {Object} pool - MySQL connection pool
 * @param {string} table - Table name
 * @param {string} whereClause - WHERE clause (optional)
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Total count
 */
async function getTotalCount(pool, table, whereClause = '', params = []) {
    const query = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const [result] = await pool.execute(query, params);
    return result[0].total;
}

module.exports = {
    getPaginationParams,
    createPaginatedResponse,
    getTotalCount
};

