import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import OverlayLayout from '../components/OverlayLayout'

/**
 * SpeedLeaderboardOverlay Component - Full Leaderboard for OBS
 * 
 * Displays the complete speed leaderboard in a broadcast-style layout:
 * - Yellow header bar with "SPT"
 * - White sub-header with logo and "SPEED [QUALIFICATION/FINALS]"
 * - Teal/blue gradient background
 * - Real-time updates via Socket.IO
 */
function SpeedLeaderboardOverlay() {
  const [searchParams] = useSearchParams()
  const competitionId = searchParams.get('competition')
  const round = searchParams.get('round') || 'qualification' // 'qualification' or 'finals'
  
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
    socketRef.current.on('speed-qualification-updated', (data) => {
      if (data.speed_competition_id === parseInt(competitionId) && round === 'qualification') {
        fetchLeaderboard(competitionId, round)
      }
    })

    socketRef.current.on('speed-finals-updated', (data) => {
      if (data.speed_competition_id === parseInt(competitionId) && round === 'finals') {
        fetchLeaderboard(competitionId, round)
      }
    })

    // Fetch initial data
    fetchCompetition(competitionId)
    fetchLeaderboard(competitionId, round)

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [competitionId, round])

  const fetchCompetition = async (compId) => {
    try {
      const response = await fetch(`/api/speed-competitions/${compId}`)
      if (response.ok) {
        const data = await response.json()
        setCompetition(data)
      }
    } catch (error) {
      console.error('Error fetching competition:', error)
    }
  }

  const fetchLeaderboard = async (compId, roundType) => {
    try {
      if (roundType === 'qualification') {
        const response = await fetch(`/api/speed-competitions/${compId}/qualification`)
        if (response.ok) {
          const data = await response.json()
          // Sort by rank (null ranks at the end)
          const sorted = data.sort((a, b) => {
            if (a.rank === null && b.rank === null) return 0
            if (a.rank === null) return 1
            if (b.rank === null) return -1
            return a.rank - b.rank
          })
          setLeaderboard(sorted)
          setLoading(false)
        }
      } else {
        // For finals, we show matches in bracket order
        const response = await fetch(`/api/speed-competitions/${compId}/finals`)
        if (response.ok) {
          const data = await response.json()
          setLeaderboard(data)
          setLoading(false)
        }
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

  const roundLabel = round === 'qualification' ? 'QUALIFICATION' : 'FINALS'

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
                SPEED {roundLabel}
              </h2>
            </div>
          </div>

          {/* Main Body - Teal/Blue Gradient */}
          <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 p-6 rounded-b-2xl">
            {round === 'qualification' ? (
              <QualificationLeaderboard leaderboard={leaderboard} />
            ) : (
              <FinalsLeaderboard leaderboard={leaderboard} />
            )}
          </div>
        </div>
      </div>
    </OverlayLayout>
  )
}

/**
 * Qualification Leaderboard - Shows ranked climbers with times
 */
function QualificationLeaderboard({ leaderboard }) {
  // Split into 2 columns
  const midPoint = Math.ceil(leaderboard.length / 2)
  const leftColumn = leaderboard.slice(0, midPoint)
  const rightColumn = leaderboard.slice(midPoint)

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '-'
    const totalSeconds = Math.floor(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const milliseconds = Math.floor((seconds - totalSeconds) * 1000)
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left Column */}
      <div className="space-y-2">
        {leftColumn.map((climber) => (
          <QualificationRow key={climber.climber_id || climber.id} climber={climber} formatTime={formatTime} />
        ))}
      </div>

      {/* Right Column */}
      <div className="space-y-2">
        {rightColumn.map((climber) => (
          <QualificationRow key={climber.climber_id || climber.id} climber={climber} formatTime={formatTime} />
        ))}
      </div>
    </div>
  )
}

function QualificationRow({ climber, formatTime }) {
  const isValid = climber.status === 'VALID' && climber.total_time !== null
  const rank = climber.rank

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-transparent hover:bg-white/5 transition-all duration-200 rounded">
      {/* Rank */}
      <div className="flex items-center justify-center w-8 h-8 rounded font-bold text-lg text-white flex-shrink-0">
        {rank || '-'}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold uppercase leading-tight truncate">
          {climber.name}
        </div>
        <div className="text-xs text-white/70">
          #{climber.bib_number} {climber.team ? `• ${climber.team}` : ''}
        </div>
      </div>

      {/* Times */}
      <div className="flex flex-col items-end flex-shrink-0 min-w-[140px]">
        <div className="text-xs text-white/80 mb-1">Total</div>
        <div className={`text-lg font-bold text-white tabular-nums ${!isValid ? 'text-white/50' : ''}`}>
          {isValid ? formatTime(climber.total_time) : 'DNF'}
        </div>
      </div>
    </div>
  )
}

/**
 * Finals Leaderboard - Shows matches in bracket order
 */
function FinalsLeaderboard({ leaderboard }) {
  // Group by stage
  const matchesByStage = {}
  leaderboard.forEach(match => {
    if (!matchesByStage[match.stage]) {
      matchesByStage[match.stage] = []
    }
    matchesByStage[match.stage].push(match)
  })

  const stageOrder = ['Round of 16', 'Quarter Final', 'Semi Final', 'Small Final', 'Big Final']
  const orderedStages = stageOrder.filter(stage => matchesByStage[stage])

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '-'
    const totalSeconds = Math.floor(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const milliseconds = Math.floor((seconds - totalSeconds) * 1000)
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
  }

  return (
    <div className="space-y-4">
      {orderedStages.map((stage) => (
        <div key={stage} className="bg-white/10 rounded-lg p-4">
          <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">{stage}</h3>
          <div className="space-y-2">
            {matchesByStage[stage]
              .sort((a, b) => (a.match_order || 0) - (b.match_order || 0))
              .map((match) => (
                <FinalsMatchRow key={match.id} match={match} formatTime={formatTime} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FinalsMatchRow({ match, formatTime }) {
  const winnerId = match.winner_id
  const isAWinner = winnerId === match.climber_a_id
  const isBWinner = winnerId === match.climber_b_id

  const aTotal = match.climber_a_total_time ? parseFloat(match.climber_a_total_time) : null
  const bTotal = match.climber_b_total_time ? parseFloat(match.climber_b_total_time) : null

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded">
      {/* Match Number */}
      <div className="text-white/60 text-xs font-semibold w-8 flex-shrink-0">
        M{match.match_order}
      </div>

      {/* Climber A */}
      <div className={`flex-1 ${isAWinner ? 'text-yellow-200' : 'text-white'}`}>
        <div className="text-sm font-semibold truncate">
          {match.climber_a_name}
          {isAWinner && <span className="ml-2">🏆</span>}
        </div>
        <div className="text-xs text-white/70">
          #{match.climber_a_bib} {aTotal !== null && formatTime(aTotal)}
        </div>
      </div>

      {/* VS */}
      <div className="text-white/60 text-xs font-bold">VS</div>

      {/* Climber B */}
      <div className={`flex-1 text-right ${isBWinner ? 'text-yellow-200' : 'text-white'}`}>
        <div className="text-sm font-semibold truncate">
          {match.climber_b_name || 'BYE'}
          {isBWinner && <span className="ml-2">🏆</span>}
        </div>
        <div className="text-xs text-white/70">
          {match.climber_b_bib ? `#${match.climber_b_bib}` : ''} {bTotal !== null && formatTime(bTotal)}
        </div>
      </div>
    </div>
  )
}

export default SpeedLeaderboardOverlay

