import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth', {
          credentials: 'include'
        })
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
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

