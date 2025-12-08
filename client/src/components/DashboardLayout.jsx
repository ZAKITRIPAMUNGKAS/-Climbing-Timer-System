import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  UserCog, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Timer,
  Gavel,
  Calendar,
  Newspaper
} from 'lucide-react'

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.authenticated) {
          setUser(data.user)
        } else {
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        navigate('/login', { replace: true })
      }
    }
    checkAuth()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { name: 'Dashboard Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Manage Competitions', icon: Trophy, path: '/dashboard/competitions' },
    { name: 'Manage Athletes', icon: Users, path: '/dashboard/athletes' },
    { name: 'Manage Schedules', icon: Calendar, path: '/dashboard/schedules' },
    { name: 'Manage News', icon: Newspaper, path: '/dashboard/news' },
    { name: 'User Management', icon: UserCog, path: '/dashboard/users' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ]

  const quickLinks = [
    { name: 'Judge Interface', icon: Gavel, path: '/dashboard/judge-interface', external: false },
    { name: 'Timer System', icon: Timer, path: '/timersistem', external: true },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-64 pt-16 lg:pt-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 hidden lg:block">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpeg" 
                alt="FPTI" 
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <div>
                <div className="font-bold text-gray-900">FPTI</div>
                <div className="text-xs text-gray-500">Karanganyar</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              )
            })}

            {/* Quick Links Divider */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Links
              </div>
              {quickLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.path
                if (link.external) {
                  return (
                    <a
                      key={link.path}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon size={20} />
                      <span className="text-sm">{link.name}</span>
                    </a>
                  )
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            {user && (
              <div className="px-4 py-2 mb-2">
                <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        transition-all duration-300
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
        pt-16 lg:pt-0
      `}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {user && (
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-500">Administrator</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout

