/**
 * Parameter Validation Utility
 * Validates and sanitizes route parameters to prevent injection and invalid data
 */

/**
 * Validate and parse integer parameter
 * @param {string} param - Parameter value from route
 * @param {string} paramName - Name of parameter for error messages
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value (default: 1)
 * @param {number} options.max - Maximum value (optional)
 * @returns {number} Parsed and validated integer
 * @throws {Error} If parameter is invalid
 */
function validateIntParam(param, paramName, options = {}) {
    if (!param || param === 'undefined' || param === 'null') {
        throw new Error(`${paramName} is required`);
    }

    const num = parseInt(param, 10);
    
    if (isNaN(num)) {
        throw new Error(`Invalid ${paramName}: must be a number`);
    }

    const min = options.min !== undefined ? options.min : 1;
    if (num < min) {
        throw new Error(`${paramName} must be at least ${min}`);
    }

    if (options.max !== undefined && num > options.max) {
        throw new Error(`${paramName} must be at most ${options.max}`);
    }

    return num;
}

/**
 * Validate and sanitize string parameter
 * @param {string} param - Parameter value from route
 * @param {string} paramName - Name of parameter for error messages
 * @param {Object} options - Validation options
 * @param {number} options.maxLength - Maximum length (optional)
 * @param {boolean} options.allowEmpty - Allow empty strings (default: false)
 * @returns {string} Sanitized string
 * @throws {Error} If parameter is invalid
 */
function validateStringParam(param, paramName, options = {}) {
    if (param === undefined || param === null) {
        if (options.allowEmpty) {
            return '';
        }
        throw new Error(`${paramName} is required`);
    }

    if (typeof param !== 'string') {
        throw new Error(`Invalid ${paramName}: must be a string`);
    }

    const trimmed = param.trim();
    
    if (!options.allowEmpty && trimmed.length === 0) {
        throw new Error(`${paramName} cannot be empty`);
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
        throw new Error(`${paramName} must be at most ${options.maxLength} characters`);
    }

    // Basic sanitization - remove potentially dangerous characters
    return trimmed.replace(/[<>'";\\]/g, '');
}

/**
 * Middleware to validate route parameters
 * @param {Object} validations - Object mapping param names to validation functions
 * @returns {Function} Express middleware
 */
function validateParams(validations) {
    return (req, res, next) => {
        try {
            const errors = [];

            // Validate params
            if (validations.params) {
                for (const [paramName, validator] of Object.entries(validations.params)) {
                    try {
                        req.params[paramName] = validator(req.params[paramName], paramName);
                    } catch (error) {
                        errors.push(error.message);
                    }
                }
            }

            // Validate query
            if (validations.query) {
                for (const [queryName, validator] of Object.entries(validations.query)) {
                    if (req.query[queryName] !== undefined) {
                        try {
                            req.query[queryName] = validator(req.query[queryName], queryName);
                        } catch (error) {
                            errors.push(error.message);
                        }
                    }
                }
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: errors
                });
            }

            next();
        } catch (error) {
            console.error('[VALIDATION] Parameter validation error:', error);
            res.status(500).json({ error: 'Validation error' });
        }
    };
}

module.exports = {
    validateIntParam,
    validateStringParam,
    validateParams
};

