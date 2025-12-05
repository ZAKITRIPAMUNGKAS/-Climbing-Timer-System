/**
 * Audit Logger Utility
 * Logs all critical actions for appeals and compliance
 */

/**
 * Log an audit event
 * @param {Object} pool - MySQL connection pool
 * @param {Object} options - Audit log options
 * @param {Number} options.userId - User ID performing the action
 * @param {String} options.action - Action type (e.g., 'unlock_score', 'edit_finalized_score')
 * @param {String} options.entityType - Entity type (e.g., 'boulder_score', 'speed_qualification')
 * @param {Number} options.entityId - Entity ID
 * @param {Object} options.details - Additional details (JSON)
 * @param {String} options.ipAddress - IP address of requester
 * @param {String} options.userAgent - User agent string
 */
async function logAuditEvent(pool, options) {
    try {
        const {
            userId,
            action,
            entityType,
            entityId,
            details = {},
            ipAddress = null,
            userAgent = null
        } = options;

        await pool.execute(
            `INSERT INTO audit_logs 
             (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                action,
                entityType,
                entityId || null,
                JSON.stringify(details),
                ipAddress,
                userAgent
            ]
        );
    } catch (error) {
        console.error('[AUDIT] Failed to log audit event:', error);
        // Don't throw - audit logging failure shouldn't break the main operation
    }
}

/**
 * Check if user has permission for appeals (SUPER_ADMIN or CHIEF_JUDGE)
 * Note: For now, we'll use 'admin' role as SUPER_ADMIN
 * You can extend this to support CHIEF_JUDGE role later
 */
async function hasAppealPermission(pool, userId) {
    try {
        const [users] = await pool.execute(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) return false;
        
        // Admin role has appeal permission
        // You can add 'chief_judge' role later
        return users[0].role === 'admin';
    } catch (error) {
        console.error('[AUDIT] Error checking appeal permission:', error);
        return false;
    }
}

module.exports = {
    logAuditEvent,
    hasAppealPermission
};

