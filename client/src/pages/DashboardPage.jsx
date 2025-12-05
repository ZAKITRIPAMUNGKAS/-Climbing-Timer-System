import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react'

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
    </div>
  )
}

export default DashboardPage

