/**
 * Error Handler Utility
 * Sanitizes error messages to prevent information leakage
 */

/**
 * Sanitize error message for client response
 * Removes sensitive information like stack traces, file paths, etc.
 * @param {Error} error - Error object
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {Object} Sanitized error response
 */
function sanitizeError(error, isDevelopment = false) {
    // Default error message
    const defaultMessage = 'An error occurred. Please try again later.';
    
    // In development, show more details
    if (isDevelopment) {
        return {
            error: error.message || defaultMessage,
            code: error.code,
            stack: error.stack,
            details: error.details
        };
    }

    // In production, sanitize error messages
    const sanitized = {
        error: defaultMessage
    };

    // Only include safe error codes
    if (error.code && isSafeErrorCode(error.code)) {
        sanitized.code = error.code;
    }

    // Include user-friendly messages for known errors
    if (error.message) {
        const userMessage = getUserFriendlyMessage(error);
        if (userMessage) {
            sanitized.error = userMessage;
        }
    }

    return sanitized;
}

/**
 * Check if error code is safe to expose
 * @param {string} code - Error code
 * @returns {boolean} True if safe
 */
function isSafeErrorCode(code) {
    // Safe error codes that don't expose system information
    const safeCodes = [
        'ER_DUP_ENTRY',
        'ER_NO_REFERENCED_ROW_2',
        'ER_BAD_FIELD_ERROR',
        'ER_PARSE_ERROR'
    ];
    
    return safeCodes.includes(code);
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string|null} User-friendly message or null
 */
function getUserFriendlyMessage(error) {
    // Map technical errors to user-friendly messages
    const errorMap = {
        'ER_DUP_ENTRY': 'This record already exists',
        'ER_NO_REFERENCED_ROW_2': 'Referenced record not found',
        'ER_BAD_FIELD_ERROR': 'Invalid field in request',
        'ER_PARSE_ERROR': 'Invalid request format',
        'ECONNREFUSED': 'Database connection failed',
        'ETIMEDOUT': 'Request timeout',
        'ENOTFOUND': 'Service unavailable'
    };

    if (error.code && errorMap[error.code]) {
        return errorMap[error.code];
    }

    // Check for common error patterns
    if (error.message) {
        if (error.message.includes('SQL')) {
            return 'Database error occurred';
        }
        if (error.message.includes('ENOENT')) {
            return 'File not found';
        }
        if (error.message.includes('EACCES')) {
            return 'Permission denied';
        }
    }

    return null;
}

/**
 * Log error with sanitization
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information to log
 */
function logError(error, context, additionalInfo = {}) {
    // Log full error details (server-side only)
    const errorLog = {
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        code: error.code,
        stack: error.stack,
        ...additionalInfo
    };

    // Remove sensitive information from logs
    if (errorLog.stack) {
        // Remove file paths that might contain sensitive info
        errorLog.stack = errorLog.stack.replace(/\/[^\s]+/g, '[PATH]');
    }

    console.error(`[ERROR] ${context}:`, JSON.stringify(errorLog, null, 2));
}

/**
 * Express error handler middleware
 * Should be used as the last middleware
 */
function errorHandler(err, req, res, next) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log error
    logError(err, req.path, {
        method: req.method,
        params: req.params,
        query: req.query,
        userId: req.session?.userId
    });

    // Sanitize error for response
    const sanitized = sanitizeError(err, isDevelopment);

    // Determine status code
    let statusCode = 500;
    if (err.statusCode) {
        statusCode = err.statusCode;
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409; // Conflict
    } else if (err.code && err.code.startsWith('ER_NO_REFERENCED_ROW')) {
        statusCode = 404; // Not Found
    }

    res.status(statusCode).json(sanitized);
}

module.exports = {
    sanitizeError,
    logError,
    errorHandler,
    getUserFriendlyMessage
};

