/**
 * Simple In-Memory Cache Utility
 * For caching API responses that don't change frequently
 * 
 * Note: For production with multiple instances, use Redis instead
 */

class SimpleCache {
    constructor(defaultTTL = 300000) { // 5 minutes default
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    set(key, value, ttl = null) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        
        this.cache.set(key, {
            value,
            expiresAt,
            createdAt: Date.now()
        });
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        this.clearExpired();
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Invalidate cache by pattern
     * @param {string} pattern - Pattern to match (e.g., 'competitions:*')
     */
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}

// Create singleton instance
const cache = new SimpleCache(300000); // 5 minutes default TTL

// Cleanup expired entries every minute
setInterval(() => {
    cache.clearExpired();
}, 60000);

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in milliseconds
 * @param {Function} keyGenerator - Function to generate cache key from request
 * @returns {Function} Express middleware
 */
function cacheMiddleware(ttl = 300000, keyGenerator = null) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator 
            ? keyGenerator(req)
            : `cache:${req.method}:${req.originalUrl}`;

        // Try to get from cache
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to cache response
        res.json = function(data) {
            // Only cache successful responses
            if (res.statusCode === 200) {
                cache.set(cacheKey, data, ttl);
            }
            return originalJson(data);
        };

        next();
    };
}

/**
 * Invalidate cache for specific patterns
 * Should be called after data mutations
 * @param {string|Array} patterns - Pattern(s) to invalidate
 */
function invalidateCache(patterns) {
    if (Array.isArray(patterns)) {
        patterns.forEach(pattern => cache.invalidatePattern(pattern));
    } else {
        cache.invalidatePattern(patterns);
    }
}

module.exports = {
    cache,
    cacheMiddleware,
    invalidateCache
};

