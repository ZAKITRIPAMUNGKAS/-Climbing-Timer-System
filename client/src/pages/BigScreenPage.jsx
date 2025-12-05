import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'

function BigScreenPage() {
  const { competitionId } = useParams()
  const [competition, setCompetition] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [competitionType, setCompetitionType] = useState(null) // 'boulder' or 'speed'
  const [round, setRound] = useState('qualification') // For speed competitions
  const scrollContainerRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    // Determine competition type and fetch data
    fetchCompetitionData()

    // Initialize socket for real-time updates
    socketRef.current = io()

    // Listen for updates based on competition type
    if (competitionType === 'boulder') {
      socketRef.current.on('score-updated', (data) => {
        if (data.competition_id === parseInt(competitionId)) {
          fetchLeaderboard()
        }
      })
    } else if (competitionType === 'speed') {
      socketRef.current.on('speed-qualification-updated', (data) => {
        if (data.speed_competition_id === parseInt(competitionId) && round === 'qualification') {
          fetchSpeedQualification()
        }
      })
      socketRef.current.on('speed-finals-updated', (data) => {
        if (data.speed_competition_id === parseInt(competitionId) && round === 'finals') {
          fetchSpeedFinals()
        }
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [competitionId, competitionType, round])

  // Auto-scroll effect for long lists (Marquee style)
  useEffect(() => {
    if (!scrollContainerRef.current || leaderboard.length === 0) return

    const container = scrollContainerRef.current
    let animationFrameId = null
    let scrollPosition = 0
    let isScrolling = false

    const checkAndStartScroll = () => {
      const content = container.querySelector('.scroll-content')
      if (!content) {
        // Retry after a short delay if content not ready
        setTimeout(checkAndStartScroll, 100)
        return
      }

      const containerHeight = container.clientHeight
      const contentHeight = content.scrollHeight

      // Only enable auto-scroll if content is taller than container
      if (contentHeight > containerHeight && !isScrolling) {
        isScrolling = true
        const scrollSpeed = 0.3 // pixels per frame

        const scroll = () => {
          scrollPosition += scrollSpeed
          const maxScroll = contentHeight - containerHeight
          
          if (scrollPosition >= maxScroll) {
            // Smooth loop back to top
            scrollPosition = 0
            container.scrollTop = 0
          } else {
            container.scrollTop = scrollPosition
          }

          animationFrameId = requestAnimationFrame(scroll)
        }

        // Start scrolling
        animationFrameId = requestAnimationFrame(scroll)
      }
    }

    // Wait a bit for content to render, then check
    const timeoutId = setTimeout(checkAndStartScroll, 300)

    return () => {
      clearTimeout(timeoutId)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      isScrolling = false
    }
  }, [leaderboard])

  const fetchCompetitionData = async () => {
    try {
      // Try Boulder first
      const boulderRes = await fetch(`/api/competitions/${competitionId}`)
      if (boulderRes.ok) {
        const data = await boulderRes.json()
        setCompetition(data)
        setCompetitionType('boulder')
        fetchLeaderboard()
        return
      }

      // Try Speed
      const speedRes = await fetch(`/api/speed-competitions/${competitionId}`)
      if (speedRes.ok) {
        const data = await speedRes.json()
        setCompetition(data)
        setCompetitionType('speed')
        if (data.status === 'finals') {
          setRound('finals')
          fetchSpeedFinals()
        } else {
          fetchSpeedQualification()
        }
        return
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching competition:', error)
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        // Take top 8 or all if less than 8
        const top8 = data.slice(0, 8)
        setLeaderboard(top8)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLoading(false)
    }
  }

  const fetchSpeedQualification = async () => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/qualification`)
      if (response.ok) {
        const data = await response.json()
        // Sort by rank and take top 8
        const sorted = data
          .filter(s => s.rank)
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 8)
        setLeaderboard(sorted)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching qualification:', error)
      setLoading(false)
    }
  }

  const fetchSpeedFinals = async () => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/finals`)
      if (response.ok) {
        const data = await response.json()
        // Convert matches to leaderboard format
        const finalsList = data
          .sort((a, b) => {
            // Sort: Small Final first, then Big Final, then by match_order
            const stageOrder = { 'Small Final': 1, 'Big Final': 2, 'Semi Final': 3, 'Quarter Final': 4 }
            if (stageOrder[a.stage] !== stageOrder[b.stage]) {
              return stageOrder[a.stage] - stageOrder[b.stage]
            }
            return a.match_order - b.match_order
          })
          .slice(0, 8)
        
        setLeaderboard(finalsList)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching finals:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold mb-4">LOADING...</div>
          <div className="text-2xl text-gray-400">Memuat data kompetisi</div>
        </div>
      </div>
    )
  }

  if (!competition || leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold mb-4">NO DATA</div>
          <div className="text-2xl text-gray-400">Tidak ada data untuk ditampilkan</div>
        </div>
      </div>
    )
  }

  const roundName = competitionType === 'speed' 
    ? (round === 'finals' ? 'FINALS' : 'QUALIFICATION')
    : 'LEADERBOARD'

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="bg-black border-b-4 border-cyan-400 py-6 px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-cyan-400 mb-2 tracking-wider uppercase">
            {competition.name || 'COMPETITION'}
          </h1>
          <div className="text-3xl md:text-4xl font-bold text-white">
            {roundName}
          </div>
        </div>
      </div>

      {/* Leaderboard - Scrollable */}
      <div 
        ref={scrollContainerRef}
        className="h-[calc(100vh-180px)] overflow-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="scroll-content">
          <div className="px-8 py-6">
            {competitionType === 'boulder' ? (
              // Boulder Leaderboard
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-6 flex items-center gap-8 hover:bg-gray-800 transition-colors"
                  >
                    {/* Rank - Massive */}
                    <div className="text-7xl md:text-8xl font-black text-cyan-400 w-32 text-center">
                      {entry.rank || index + 1}
                    </div>
                    
                    {/* Name - Big */}
                    <div className="flex-1">
                      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                        {entry.name || '-'}
                      </div>
                      <div className="text-2xl md:text-3xl text-gray-300">
                        {entry.team || '-'}
                      </div>
                    </div>
                    
                    {/* Score - Huge & Green */}
                    <div className="text-right">
                      <div className="text-6xl md:text-7xl font-black text-green-400 mb-2">
                        {entry.totalScore?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-xl text-gray-400">
                        {entry.scores?.filter(s => s.isTop).length || 0} Tops • {entry.scores?.filter(s => s.isZone).length || 0} Zones
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Speed Leaderboard
              <div className="space-y-4">
                {leaderboard.map((entry, index) => {
                  // Handle finals matches differently
                  if (round === 'finals' && entry.stage) {
                    return (
                      <div
                        key={entry.id}
                        className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-6"
                      >
                        <div className="text-2xl font-bold text-cyan-400 mb-4 uppercase">
                          {entry.stage} - Match {entry.match_order}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Climber A */}
                          <div className="flex items-center gap-4">
                            <div className="text-5xl font-black text-cyan-400 w-16 text-center">A</div>
                            <div className="flex-1">
                              <div className="text-3xl font-bold text-white mb-1">
                                {entry.climber_a_name || '-'}
                              </div>
                              <div className="text-xl text-gray-300">
                                {entry.climber_a_team || '-'} • Bib #{entry.climber_a_bib || '-'}
                              </div>
                            </div>
                            <div className="text-5xl font-black text-green-400">
                              {entry.time_a ? `${entry.time_a}s` : '-'}
                            </div>
                          </div>
                          {/* Climber B */}
                          <div className="flex items-center gap-4">
                            <div className="text-5xl font-black text-cyan-400 w-16 text-center">B</div>
                            <div className="flex-1">
                              <div className="text-3xl font-bold text-white mb-1">
                                {entry.climber_b_name || '-'}
                              </div>
                              <div className="text-xl text-gray-300">
                                {entry.climber_b_team || '-'} • Bib #{entry.climber_b_bib || '-'}
                              </div>
                            </div>
                            <div className="text-5xl font-black text-green-400">
                              {entry.time_b ? `${entry.time_b}s` : '-'}
                            </div>
                          </div>
                        </div>
                        {entry.winner_id && (
                          <div className="mt-4 text-center">
                            <div className="text-3xl font-bold text-green-400">
                              Winner: {entry.winner_id === entry.climber_a_id ? entry.climber_a_name : entry.climber_b_name}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Qualification format
                  return (
                    <div
                      key={entry.id || entry.climber_id}
                      className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-6 flex items-center gap-8 hover:bg-gray-800 transition-colors"
                    >
                      {/* Rank - Massive */}
                      <div className="text-7xl md:text-8xl font-black text-cyan-400 w-32 text-center">
                        {entry.rank || index + 1}
                      </div>
                      
                      {/* Name - Big */}
                      <div className="flex-1">
                        <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                          {entry.name || '-'}
                        </div>
                        <div className="text-2xl md:text-3xl text-gray-300">
                          {entry.team || '-'} • Bib #{entry.bib_number || '-'}
                        </div>
                      </div>
                      
                      {/* Time - Huge & Green */}
                      <div className="text-right">
                        <div className="text-6xl md:text-7xl font-black text-green-400 mb-2">
                          {entry.total_time ? `${entry.total_time}s` : '-'}
                        </div>
                        <div className="text-xl text-gray-400">
                          {entry.lane_a_time ? `${entry.lane_a_time}s` : '-'} / {entry.lane_b_time ? `${entry.lane_b_time}s` : '-'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="bg-black border-t-4 border-cyan-400 py-4 px-8">
        <div className="text-center text-xl text-gray-400">
          LIVE SCORE • {new Date().toLocaleString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}

export default BigScreenPage

