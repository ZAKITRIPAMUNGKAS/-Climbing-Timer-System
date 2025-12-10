/**
 * Session management utilities
 * Session duration: 2 hours
 */

const SESSION_KEY = 'fpti_session'
const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

/**
 * Save session to localStorage
 * @param {Object} user - User object with id and username
 */
export function saveSession(user) {
  const sessionData = {
    user,
    timestamp: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
}

/**
 * Get session from localStorage
 * @returns {Object|null} Session data or null if expired/not found
 */
export function getSession() {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY)
    if (!sessionStr) return null

    const sessionData = JSON.parse(sessionStr)
    
    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      clearSession()
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Error reading session:', error)
    clearSession()
    return null
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Check if user is authenticated (session exists and not expired)
 * @returns {boolean}
 */
export function isAuthenticated() {
  const session = getSession()
  return session !== null
}

/**
 * Get current user from session
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  const session = getSession()
  return session ? session.user : null
}

