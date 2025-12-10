import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Users, Calendar, TrendingUp, Monitor, ExternalLink } from 'lucide-react'

function DashboardPage() {
  const [stats, setStats] = useState({
    competitions: 0,
    athletes: 0,
    activeCompetitions: 0,
    schedules: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [competitionsRes, athletesRes, schedulesRes] = await Promise.all([
          fetch('/api/competitions'),
          fetch('/api/athletes'),
          fetch('/api/schedules')
        ])

        const competitions = await competitionsRes.json()
        const athletes = await athletesRes.json()
        const schedules = await schedulesRes.json()

        setStats({
          competitions: competitions.length,
          athletes: athletes.length,
          activeCompetitions: competitions.filter(c => c.status === 'active').length,
          schedules: schedules.length
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Competitions',
      value: stats.competitions,
      icon: Trophy,
      color: 'blue',
      link: '/dashboard/competitions'
    },
    {
      title: 'Active Competitions',
      value: stats.activeCompetitions,
      icon: TrendingUp,
      color: 'green',
      link: '/dashboard/competitions'
    },
    {
      title: 'Total Athletes',
      value: stats.athletes,
      icon: Users,
      color: 'purple',
      link: '/dashboard/athletes'
    },
    {
      title: 'Schedules',
      value: stats.schedules,
      icon: Calendar,
      color: 'orange',
      link: '/dashboard/schedules'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600'
          }
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/competitions"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Trophy className="text-blue-600 mb-2" size={24} />
            <div className="font-semibold text-gray-900">Manage Competitions</div>
            <div className="text-sm text-gray-500">Create and edit competitions</div>
          </Link>
          <Link
            to="/dashboard/athletes"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Users className="text-purple-600 mb-2" size={24} />
            <div className="font-semibold text-gray-900">Manage Athletes</div>
            <div className="text-sm text-gray-500">Add or bulk upload athletes</div>
          </Link>
          <Link
            to="/dashboard/judge-interface"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <TrendingUp className="text-green-600 mb-2" size={24} />
            <div className="font-semibold text-gray-900">Judge Interface</div>
            <div className="text-sm text-gray-500">Input scores for competitions</div>
          </Link>
        </div>
      </div>

      {/* OBS Overlay Links Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="text-indigo-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">OBS Overlay Links</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Copy these links to use in OBS Browser Source for live streaming overlays.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Speed Lower Third */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Speed Lower Third</div>
              <ExternalLink className="text-gray-400" size={16} />
            </div>
            <div className="text-xs text-gray-600 mb-3">Live timer & climber info for Speed competitions</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/overlay/speed-lower-third`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/overlay/speed-lower-third`)
                  alert('Link copied to clipboard!')
                }}
                className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Speed Leaderboard */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Speed Leaderboard</div>
              <ExternalLink className="text-gray-400" size={16} />
            </div>
            <div className="text-xs text-gray-600 mb-3">Full leaderboard display for Speed competitions (Qualification/Finals)</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/overlay/speed-leaderboard?competition=ID&round=qualification`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/overlay/speed-leaderboard?competition=ID&round=qualification`)
                  alert('Link copied! Replace ID with competition ID. Use round=qualification or round=finals')
                }}
                className="px-3 py-2 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-purple-700 mt-2 space-y-1">
              <div>⚠️ Replace "ID" with competition ID</div>
              <div>⚠️ Use round=qualification or round=finals</div>
              <div className="text-gray-600 mt-1">Example: ?competition=3&round=qualification</div>
            </div>
          </div>

          {/* Boulder Current Climber */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Boulder Current Climber</div>
              <ExternalLink className="text-gray-400" size={16} />
            </div>
            <div className="text-xs text-gray-600 mb-3">Current climber card with name and total points only</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/overlay/boulder-current?competition=ID&search=NAME_OR_BIB`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/overlay/boulder-current?competition=ID&search=NAME_OR_BIB`)
                  alert('Link copied! Replace ID and NAME_OR_BIB with actual values.')
                }}
                className="px-3 py-2 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-amber-700 mt-2 space-y-1">
              <div>⚠️ Replace "ID" with competition ID</div>
              <div>⚠️ Replace "NAME_OR_BIB" with climber name or bib number (optional)</div>
              <div className="text-gray-600 mt-1">Example: ?competition=3&search=KEMIN or ?competition=3&search=1</div>
            </div>
          </div>

          {/* Boulder Timer */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Boulder Live Timer</div>
              <ExternalLink className="text-gray-400" size={16} />
            </div>
            <div className="text-xs text-gray-600 mb-3">Live countdown timer from boulder timer system</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/overlay/boulder-timer`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/overlay/boulder-timer`)
                  alert('Link copied to clipboard!')
                }}
                className="px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Optional: ?position=top-right|top-left|bottom-right|bottom-left</div>
          </div>

          {/* Boulder Leaderboard */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-cyan-50 to-teal-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Boulder Leaderboard</div>
              <ExternalLink className="text-gray-400" size={16} />
            </div>
            <div className="text-xs text-gray-600 mb-3">Full leaderboard display for OBS with 2-column layout</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/overlay/boulder-leaderboard?competition=ID`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/overlay/boulder-leaderboard?competition=ID`)
                  alert('Link copied! Replace ID with competition ID.')
                }}
                className="px-3 py-2 bg-cyan-600 text-white text-xs rounded-md hover:bg-cyan-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-cyan-700 mt-2">⚠️ Replace "ID" with actual competition ID</div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">📋 How to Use in OBS:</h3>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open OBS Studio and add a new "Browser Source"</li>
            <li>Paste the copied URL into the URL field</li>
            <li>Set width: 1920, height: 1080 (or your stream resolution)</li>
            <li>Check "Shutdown source when not visible" and "Refresh browser when scene becomes active"</li>
            <li>For chroma key, add <code className="bg-gray-200 px-1 rounded">?chroma=true</code> to the URL</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

