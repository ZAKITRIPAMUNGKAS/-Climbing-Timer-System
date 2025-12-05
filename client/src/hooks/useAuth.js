import { useState, useEffect } from 'react'

/**
 * Custom hook to get current authenticated user
 * @returns {Object} { user, loading, isAdmin }
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.authenticated && data.user) {
          setUser(data.user)
          setIsAdmin(data.user.role === 'admin')
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  return { user, loading, isAdmin }
}

