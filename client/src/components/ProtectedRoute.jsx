import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated as checkLocalSession } from '../utils/session'

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // First check localStorage session
      const hasLocalSession = checkLocalSession()
      
      if (hasLocalSession) {
        // If local session exists, verify with server
        try {
          const response = await fetch('/api/check-auth', {
            credentials: 'include'
          })
          
          if (response.status === 429) {
            // Rate limited - assume authenticated if local session exists
            console.warn('Rate limited on auth check, using local session')
            setIsAuthenticated(true)
            setLoading(false)
            return
          }
          
          if (!response.ok) {
            setIsAuthenticated(false)
            setLoading(false)
            return
          }
          
          const data = await response.json()
          setIsAuthenticated(data.authenticated)
        } catch (error) {
          console.error('Auth check error:', error)
          // On error, trust local session if exists
          setIsAuthenticated(hasLocalSession)
        } finally {
          setLoading(false)
        }
      } else {
        // No local session, check server anyway (might have server session)
        try {
          const response = await fetch('/api/check-auth', {
            credentials: 'include'
          })
          
          if (response.status === 429) {
            // Rate limited - assume not authenticated
            console.warn('Rate limited on auth check')
            setIsAuthenticated(false)
            setLoading(false)
            return
          }
          
          if (!response.ok) {
            setIsAuthenticated(false)
            setLoading(false)
            return
          }
          
          const data = await response.json()
          setIsAuthenticated(data.authenticated)
        } catch (error) {
          console.error('Auth check error:', error)
          setIsAuthenticated(false)
        } finally {
          setLoading(false)
        }
      }
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-lg font-semibold text-gray-900">Memeriksa autentikasi...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

