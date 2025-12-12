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

  // Fetch competition data on mount
  useEffect(() => {
    fetchCompetitionData()
  }, [competitionId])

  // Setup socket listeners when competition type is determined
  useEffect(() => {
    if (!competitionType) return

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
        socketRef.current.off('score-updated')
        socketRef.current.off('speed-qualification-updated')
        socketRef.current.off('speed-finals-updated')
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
    let scrollDirection = 1 // 1 for down, -1 for up
    const scrollSpeed = 0.5 // pixels per frame

    const startAutoScroll = () => {
      const content = container.querySelector('.scroll-content')
      if (!content) {
        // Retry after a short delay if content not ready
        setTimeout(startAutoScroll, 100)
        return
      }

      const containerHeight = container.clientHeight
      const contentHeight = content.scrollHeight

      // Always enable auto-scroll for big screen
      if (!isScrolling) {
        isScrolling = true

        const scroll = () => {
          const maxScroll = contentHeight - containerHeight
          
          // Update scroll position
          scrollPosition += scrollSpeed * scrollDirection
          
          // Check if we've reached the bottom
          if (scrollPosition >= maxScroll) {
            scrollPosition = maxScroll
            // Wait 2 seconds at bottom, then scroll back up
            setTimeout(() => {
              scrollDirection = -1
            }, 2000)
          }
          
          // Check if we've reached the top
          if (scrollPosition <= 0) {
            scrollPosition = 0
            // Wait 2 seconds at top, then scroll down
            setTimeout(() => {
              scrollDirection = 1
            }, 2000)
          }
          
          container.scrollTop = scrollPosition
          animationFrameId = requestAnimationFrame(scroll)
        }

        // Start scrolling after initial delay
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(scroll)
        }, 1000)
      }
    }

    // Wait a bit for content to render, then start
    const timeoutId = setTimeout(startAutoScroll, 500)

    return () => {
      clearTimeout(timeoutId)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      isScrolling = false
      scrollPosition = 0
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
        // For boulder, round is determined automatically from competition.round
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
      <div className="min-h-screen bg-rich-black text-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-goldenrod mb-4"></div>
          <div className="text-4xl md:text-5xl font-bold mb-2 text-goldenrod">LOADING...</div>
          <div className="text-xl md:text-2xl text-gray-400">Memuat data kompetisi</div>
        </div>
      </div>
    )
  }

  if (!competition || leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-rich-black text-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold mb-2 text-goldenrod">NO DATA</div>
          <div className="text-xl md:text-2xl text-gray-400">Tidak ada data untuk ditampilkan</div>
        </div>
      </div>
    )
  }

  // Determine round name based on competition type and round
  const roundName = competitionType === 'speed' 
    ? (round === 'finals' ? 'FINALS' : 'QUALIFICATION')
    : (competition?.round === 'final' ? 'FINAL' : competition?.round === 'semifinal' ? 'SEMIFINAL' : 'KUALIFIKASI')

  return (
    <div className="min-h-screen bg-rich-black text-off-white overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="bg-gunmetal border-b border-white/10 py-6 md:py-8 px-4 md:px-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-goldenrod mb-2 tracking-tight uppercase">
            {competition.name || 'COMPETITION'}
          </h1>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
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
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            {competitionType === 'boulder' ? (
              // Boulder Leaderboard - Modern Card Style
              <div className="space-y-4 sm:space-y-5">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full overflow-hidden"
                  >
                    {/* Large Rank Watermark - Background */}
                    <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                      <span className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-200 select-none">
                        {entry.rank || index + 1}
                      </span>
                    </div>

                    {/* Left: Athlete Info */}
                    <div className="relative z-10 flex-1 min-w-0 w-full sm:w-auto pl-8 sm:pl-0">
                      {/* Name */}
                      <div className="mb-2">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1 truncate">
                          {entry.name || '-'}
                        </div>
                        <div className="text-sm sm:text-base text-slate-500">
                          {entry.team || 'SOLO'}
                        </div>
                      </div>

                      {/* Score Grid - Modern Pills with Gradients */}
                      <div className="space-y-2 flex flex-col items-start">
                        {/* Grid Container */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-fit">
                          {entry.scores?.map((score, idx) => {
                            const zoneAttempt = score.zoneAttempts || 0
                            const topAttempt = score.topAttempts || 0
                            
                            return (
                              <div key={idx} className="flex flex-col gap-1.5 w-14 sm:w-16 md:w-18">
                                {/* Zone Attempt - Yellow/Orange Gradient */}
                                <div className={`w-full h-16 sm:h-20 md:h-24 rounded-md flex items-center justify-center font-bold text-base sm:text-lg md:text-xl ${
                                  zoneAttempt > 0
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                                    : 'bg-gray-100 border border-gray-200 text-gray-400'
                                }`}>
                                  {zoneAttempt > 0 ? zoneAttempt : '-'}
                                </div>
                                {/* Top Attempt - Green Gradient */}
                                <div className={`w-full h-16 sm:h-20 md:h-24 rounded-md flex items-center justify-center font-bold text-base sm:text-lg md:text-xl ${
                                  topAttempt > 0
                                    ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md'
                                    : 'bg-gray-100 border border-gray-200 text-gray-400'
                                }`}>
                                  {topAttempt > 0 ? topAttempt : '-'}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Boulder Number Labels */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-fit">
                          {entry.scores?.map((_, idx) => (
                            <div key={idx} className="text-center w-14 sm:w-16 md:w-18">
                              <span className="text-xs sm:text-sm text-slate-400 font-semibold">{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Total Score - Large Monospace */}
                    <div className="relative z-10 flex flex-row sm:flex-col items-center sm:items-end justify-end w-full sm:w-auto flex-shrink-0 sm:min-w-[140px] md:min-w-[160px] mt-2 sm:mt-0">
                      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tabular-nums font-mono">
                        {entry.totalScore?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Speed Leaderboard
              <div className="space-y-3 sm:space-y-4">
                {leaderboard.map((entry, index) => {
                  // Handle finals matches differently
                  if (round === 'finals' && entry.stage) {
                    return (
                      <div
                        key={entry.id}
                        className="bg-rich-black border border-white/10 rounded-lg p-4 sm:p-6 hover:bg-gunmetal/30 transition-all duration-200"
                      >
                        <div className="text-xl sm:text-2xl font-bold text-goldenrod mb-4 uppercase">
                          {entry.stage} - Match {entry.match_order}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {/* Climber A */}
                          <div className="flex items-center gap-4">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-goldenrod w-12 sm:w-16 text-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 rounded-lg py-2 text-gray-900">A</div>
                            <div className="flex-1">
                              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                {entry.climber_a_name || '-'}
                              </div>
                              <div className="text-base sm:text-lg md:text-xl text-white/80">
                                {entry.climber_a_team || '-'} • Bib #{entry.climber_a_bib || '-'}
                              </div>
                            </div>
                            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-green-400" style={{
                              textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                            }}>
                              {entry.time_a ? `${entry.time_a}s` : '-'}
                            </div>
                          </div>
                          {/* Climber B */}
                          <div className="flex items-center gap-4">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-goldenrod w-12 sm:w-16 text-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 rounded-lg py-2 text-gray-900">B</div>
                            <div className="flex-1">
                              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                {entry.climber_b_name || '-'}
                              </div>
                              <div className="text-base sm:text-lg md:text-xl text-white/80">
                                {entry.climber_b_team || '-'} • Bib #{entry.climber_b_bib || '-'}
                              </div>
                            </div>
                            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-green-400" style={{
                              textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                            }}>
                              {entry.time_b ? `${entry.time_b}s` : '-'}
                            </div>
                          </div>
                        </div>
                        {entry.winner_id && (
                          <div className="mt-4 text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-green-400" style={{
                              textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                            }}>
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
                      className="bg-rich-black border-b border-white/10 last:border-b-0 hover:bg-gunmetal/30 transition-all duration-200 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-lg"
                    >
                      {/* Left: Rank Box */}
                      <div className="relative flex-shrink-0">
                        {/* Small Rank Label Box */}
                        <div className="absolute -top-1 -right-1 bg-gray-700/90 rounded px-2 py-0.5 z-10 border border-gray-600">
                          <span className="text-xs font-bold text-white">#{entry.rank || index + 1}</span>
                        </div>
                        {/* Large Rank Box - Yellow Gold */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900">{entry.rank || index + 1}</span>
                        </div>
                      </div>
                      
                      {/* Center: Name */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-3 sm:mb-4">
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 uppercase tracking-tight">
                            {entry.name || '-'}
                          </div>
                          <div className="text-base sm:text-lg md:text-xl text-white/80 font-medium">
                            {entry.team || '-'} • Bib #{entry.bib_number || '-'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Time */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto flex-shrink-0 sm:min-w-[140px] md:min-w-[160px] mt-2 sm:mt-0">
                        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-green-400 tabular-nums mb-0 sm:mb-1" style={{
                          textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                        }}>
                          {entry.total_time ? `${entry.total_time}s` : '-'}
                        </div>
                        <div className="text-xs sm:text-sm text-white/60 font-medium uppercase tracking-wider">
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
      <div className="bg-gunmetal border-t border-white/10 py-3 sm:py-4 px-4 sm:px-8">
        <div className="text-center text-sm sm:text-base md:text-lg lg:text-xl text-gray-400">
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

