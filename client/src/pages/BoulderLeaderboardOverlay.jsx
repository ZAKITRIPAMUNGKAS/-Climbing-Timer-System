import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import OverlayLayout from '../components/OverlayLayout'

/**
 * BoulderLeaderboardOverlay Component - Full Leaderboard for OBS
 * 
 * Displays the complete boulder leaderboard in a broadcast-style layout:
 * - Yellow header bar with "SPT"
 * - White sub-header with logo and "BOULDER FINAL"
 * - Teal/blue gradient background
 * - 2-column layout: Left (1-4), Right (5-8)
 * - Real-time updates via Socket.IO
 */
function BoulderLeaderboardOverlay() {
  const [searchParams] = useSearchParams()
  const competitionId = searchParams.get('competition')
  
  const [competition, setCompetition] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!competitionId) {
      setLoading(false)
      return
    }

    // Initialize socket connection
    socketRef.current = io()

    // Listen for score updates
    socketRef.current.on('score-updated', (data) => {
      if (data.competition_id === parseInt(competitionId)) {
        fetchLeaderboard(competitionId)
      }
    })

    // Fetch initial data
    fetchCompetition(competitionId)
    fetchLeaderboard(competitionId)

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [competitionId])

  const fetchCompetition = async (compId) => {
    try {
      const response = await fetch(`/api/competitions/${compId}`)
      if (response.ok) {
        const data = await response.json()
        setCompetition(data)
      }
    } catch (error) {
      console.error('Error fetching competition:', error)
    }
  }

  const fetchLeaderboard = async (compId) => {
    try {
      const response = await fetch(`/api/competitions/${compId}/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <OverlayLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </OverlayLayout>
    )
  }

  if (!competition || leaderboard.length === 0) {
    return (
      <OverlayLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">No data available</div>
        </div>
      </OverlayLayout>
    )
  }

  // Split leaderboard into 2 columns: first half (left) and second half (right)
  const midPoint = Math.ceil(leaderboard.length / 2)
  const leftColumn = leaderboard.slice(0, midPoint)  // 1, 2, 3, 4...
  const rightColumn = leaderboard.slice(midPoint)    // 5, 6, 7, 8...

  return (
    <OverlayLayout>
      <div className="w-full h-full flex items-center justify-center p-8">
        {/* Main Container */}
        <div className="w-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl">
          {/* Yellow Header Bar */}
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 px-6 py-3 rounded-t-2xl">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Federasi Panjat Tebing Indonesia Karanganyar</h1>
            </div>
          </div>

          {/* White Sub-Header */}
          <div className="bg-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              {/* Logo FPTI */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden border-2 border-gray-200">
                <img 
                  src="/logo.jpeg" 
                  alt="FPTI Karanganyar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-pink-500 to-blue-600 rounded-full flex items-center justify-center hidden">
                  <span className="text-white font-bold text-xs">FPTI</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
                BOULDER FINAL
              </h2>
            </div>
          </div>

          {/* Main Body - Teal/Blue Gradient */}
          <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 p-6 rounded-b-2xl">
            {/* 2 Column Layout: Left (1-4), Right (5-8) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - First Half */}
              <div className="space-y-2">
                {leftColumn.map((climber) => (
                  <LeaderboardRow key={climber.id} climber={climber} />
                ))}
              </div>

              {/* Right Column - Second Half */}
              <div className="space-y-2">
                {rightColumn.map((climber) => (
                  <LeaderboardRow key={climber.id} climber={climber} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayLayout>
  )
}

/**
 * LeaderboardRow Component - Single row in the leaderboard
 */
function LeaderboardRow({ climber }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-transparent hover:bg-white/5 transition-all duration-200 rounded">
      {/* Rank */}
      <div className="flex items-center justify-center w-8 h-8 rounded font-bold text-lg text-white flex-shrink-0">
        {climber.rank}
      </div>

      {/* Profile Picture */}
      <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0 border-2 border-white/30 flex items-center justify-center shadow-md overflow-hidden">
        {climber.photo ? (
          <img 
            src={climber.photo.startsWith('http') ? climber.photo : `${window.location.origin}${climber.photo}`}
            alt={climber.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <svg 
          className={`w-6 h-6 text-white/60 ${climber.photo ? 'hidden' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold uppercase leading-tight truncate">
          {climber.name}
        </div>
      </div>

      {/* Visual Score Bar - 4 vertical segments */}
      <div className="flex gap-0.5 items-center flex-shrink-0">
        {climber.scores.map((score, idx) => {
          const hasTop = score.isTop === true || score.isTop === 1
          const hasZone = (score.isZone === true || score.isZone === 1) && !hasTop
          const hasAttempts = (score.topAttempts > 0 || score.zoneAttempts > 0 || score.attempts > 0) && !hasTop && !hasZone
          
          return (
            <div
              key={idx}
              className="w-5 h-10 rounded-sm transition-all duration-200 border border-white/20 bg-transparent relative flex flex-col justify-center overflow-hidden"
              title={`Boulder ${idx + 1}: ${hasTop ? 'TOP' : hasZone ? 'ZONE' : hasAttempts ? `${score.attempts} attempts` : 'No attempts'}`}
            >
              {/* TOP: Full white */}
              {hasTop && (
                <div className="w-full h-full bg-white absolute inset-0"></div>
              )}
              {/* ZONE: White from middle to bottom (50% from center down) */}
              {hasZone && (
                <div className="w-full h-1/2 bg-white absolute bottom-0"></div>
              )}
              {/* ATTEMPT: Show "/" symbol */}
              {hasAttempts && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">/</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Numerical Score */}
      <div className="text-right flex-shrink-0 min-w-[55px]">
        <div className="text-xl font-bold text-white tabular-nums">
          {climber.totalScore.toFixed(1)}
        </div>
      </div>
    </div>
  )
}

export default BoulderLeaderboardOverlay

