import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import OverlayLayout from '../components/OverlayLayout'

/**
 * BoulderCurrentOverlay Component - Current Climber Name Card
 * 
 * Displays a compact card showing the climber currently on the wall.
 * Shows: Name, Team, and Current Score (Top/Zone)
 * Updates instantly when a judge inputs "Zone" or "Top"
 */
function BoulderCurrentOverlay() {
  const [searchParams] = useSearchParams()
  const competitionId = searchParams.get('competition')
  const searchQuery = searchParams.get('search') // Search by name or bib
  const position = searchParams.get('position') || 'bottom-left' // 'bottom-left' or 'top-left'
  
  const [currentClimber, setCurrentClimber] = useState(null)
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // 'not_found', 'wrong_type', 'no_climbers'
  const socketRef = useRef(null)

  useEffect(() => {
    if (!competitionId) {
      console.log('[OVERLAY] No competition ID provided')
      setLoading(false)
      return
    }

    console.log('[OVERLAY] Initializing overlay for competition:', competitionId)

    // Initialize socket connection
    socketRef.current = io()

    // Listen for score updates from judge interface
    socketRef.current.on('score-updated', (data) => {
      console.log('[OVERLAY] Score updated event received:', data)
      if (data.competition_id === parseInt(competitionId)) {
        // When score is updated, that climber becomes the current climber
        console.log('[OVERLAY] Score update matches competition, updating climber...')
        fetchClimberById(competitionId, data.climber_id)
        // fetchTotalScore will be called inside fetchClimberById
      }
    })

    // Fetch initial data
    fetchCurrentClimber(competitionId)

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [competitionId])

  // Fetch climber by ID (when score is updated)
  const fetchClimberById = async (compId, climberId) => {
    try {
      console.log('[OVERLAY] Fetching climber by ID:', climberId)
      const response = await fetch(`/api/competitions/${compId}/climbers`)
      if (response.ok) {
        const climbers = await response.json()
        console.log('[OVERLAY] Found climbers:', climbers.length)
        const climber = climbers.find(c => c.id === climberId)
        if (climber) {
          console.log('[OVERLAY] Setting current climber from score update:', climber.name)
          setCurrentClimber(climber)
          fetchTotalScore(compId, climberId)
        } else {
          console.warn('[OVERLAY] Climber not found in list:', climberId)
        }
      } else {
        console.error('[OVERLAY] Failed to fetch climbers:', response.status)
      }
    } catch (error) {
      console.error('[OVERLAY] Error fetching climber by ID:', error)
    }
  }

  // Fetch total score for climber
  const fetchTotalScore = async (compId, climberId) => {
    try {
      const response = await fetch(`/api/competitions/${compId}/leaderboard`)
      if (response.ok) {
        const leaderboard = await response.json()
        const climberData = leaderboard.find(c => c.id === climberId)
        if (climberData) {
          setTotalScore(climberData.totalScore || 0)
        }
      }
    } catch (error) {
      console.error('[OVERLAY] Error fetching total score:', error)
    }
  }

  // Fetch current climber - Simplified logic
  const fetchCurrentClimber = async (compId) => {
    try {
      console.log('[OVERLAY] Fetching current climber for competition:', compId)
      setError(null)
      
      // First, check if competition exists (try boulder first)
      const competitionResponse = await fetch(`/api/competitions/${compId}`)
      if (!competitionResponse.ok) {
        // Try speed competition to give better error message
        const speedResponse = await fetch(`/api/speed-competitions/${compId}`)
        if (speedResponse.ok) {
          console.error('[OVERLAY] ❌ Competition ID', compId, 'is a Speed competition, not Boulder!')
          setError('wrong_type')
          setLoading(false)
          return
        } else {
          console.error('[OVERLAY] ❌ Competition not found (ID:', compId, ')')
          setError('not_found')
          setLoading(false)
          return
        }
      }
      
      // Competition exists, now fetch climbers
      const climbersResponse = await fetch(`/api/competitions/${compId}/climbers`)
      if (climbersResponse.ok) {
        const climbers = await climbersResponse.json()
        console.log('[OVERLAY] Climbers data received:', climbers.length, 'climbers')
        
        if (climbers && climbers.length > 0) {
          let activeClimber = null
          
          // If search query provided, find by name or bib
          if (searchQuery) {
            const query = searchQuery.toLowerCase().trim()
            activeClimber = climbers.find(c => 
              c.name.toLowerCase().includes(query) || 
              c.bib_number.toString() === query
            )
            
            if (!activeClimber) {
              console.warn('[OVERLAY] ⚠️ No climber found matching search:', searchQuery)
              setError('no_climbers')
              setLoading(false)
              return
            }
          } else {
            // Get first climber from list if no search
            activeClimber = climbers[0]
          }
          
          console.log('[OVERLAY] ✅ Setting current climber:', activeClimber.name, 'ID:', activeClimber.id)
          setCurrentClimber(activeClimber)
          setError(null)
          fetchTotalScore(compId, activeClimber.id)
          setLoading(false)
          return
        } else {
          console.warn('[OVERLAY] ⚠️ No climbers found in competition.')
          setError('no_climbers')
        }
      } else {
        console.error('[OVERLAY] ❌ Failed to fetch climbers:', climbersResponse.status)
        setError('not_found')
      }
      
      setLoading(false)
    } catch (error) {
      console.error('[OVERLAY] ❌ Error fetching current climber:', error)
      setError('not_found')
      setLoading(false)
    }
  }

  // Position classes for horizontal bar (default: bottom-center)
  const positionClasses = position === 'top-left' 
    ? 'top-4 left-4' 
    : position === 'top-right'
    ? 'top-4 right-4'
    : position === 'top-center'
    ? 'top-4 left-1/2 -translate-x-1/2'
    : position === 'bottom-center'
    ? 'bottom-4 left-1/2 -translate-x-1/2'
    : position === 'bottom-left'
    ? 'bottom-4 left-4'
    : position === 'bottom-right'
    ? 'bottom-4 right-4'
    : 'bottom-4 left-1/2 -translate-x-1/2' // Default: bottom-center

  if (loading) {
    return (
      <OverlayLayout>
        <div className={`fixed ${positionClasses} z-50 w-full max-w-6xl px-4`}>
          <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 rounded-xl px-8 py-4 shadow-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm font-bold" style={{
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
              }}>
                Loading...
              </span>
            </div>
          </div>
        </div>
      </OverlayLayout>
    )
  }

  if (!currentClimber && !loading) {
    let errorMessage = 'No Active Climber'
    let errorDetail = 'Add climbers to competition or wait for judge input'
    let iconColor = 'bg-yellow-400'
    let textColor = 'text-yellow-200'
    
    if (error === 'wrong_type') {
      errorMessage = 'Wrong Competition Type'
      errorDetail = 'This overlay is for Boulder competitions only. Competition ID ' + competitionId + ' is a Speed competition.'
      iconColor = 'bg-red-400'
      textColor = 'text-red-200'
    } else if (error === 'not_found') {
      errorMessage = 'Competition Not Found'
      errorDetail = 'Competition ID ' + competitionId + ' does not exist. Check the competition ID in the URL.'
      iconColor = 'bg-red-400'
      textColor = 'text-red-200'
    } else if (error === 'no_climbers') {
      errorMessage = 'No Climbers Added'
      errorDetail = 'This competition has no climbers yet. Add climbers in Manage Competitions.'
      iconColor = 'bg-yellow-400'
      textColor = 'text-yellow-200'
    } else if (!competitionId) {
      errorMessage = 'Missing Competition ID'
      errorDetail = 'Add ?competition=ID to the URL (e.g., ?competition=1)'
      iconColor = 'bg-red-400'
      textColor = 'text-red-200'
    }
    
    return (
      <OverlayLayout>
        <div className={`fixed ${positionClasses} z-50 w-full max-w-6xl px-4`}>
          <div className={`bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 rounded-xl px-8 py-4 shadow-2xl`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${iconColor} rounded-full ${error === 'wrong_type' || error === 'not_found' ? '' : 'animate-pulse'}`}></div>
                <span className={`${textColor} text-sm font-bold`} style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
                }}>
                  {errorMessage}
                </span>
              </div>
              <div className="text-xs text-white/80 mt-1 leading-relaxed" style={{
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
              }}>
                {errorDetail}
              </div>
            </div>
          </div>
        </div>
      </OverlayLayout>
    )
  }

  return (
    <OverlayLayout>
      <div className={`fixed ${positionClasses} z-50 w-full max-w-6xl px-4`}>
        {/* Horizontal Bar - Teal/Cyan Gradient (Same as Leaderboard) */}
        <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 rounded-xl px-8 py-4 shadow-2xl overflow-hidden">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          
          {/* Content - Horizontal Layout */}
          <div className="relative z-10 flex items-center justify-between gap-6">
            {/* Left: Name */}
            <div className="flex-1 min-w-0">
              <div className="text-3xl font-black text-white uppercase leading-tight truncate" style={{
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                letterSpacing: '0.5px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {currentClimber.name}
              </div>
            </div>

            {/* Center: Team */}
            <div className="flex-shrink-0 px-6">
              <div className="text-center">
                <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
                }}>
                  TEAM
                </div>
                <div className="text-xl font-bold text-white" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
                }}>
                  {currentClimber.team || 'N/A'}
                </div>
              </div>
            </div>

            {/* Center-Right: Total Points */}
            <div className="flex-shrink-0 px-6 border-l border-r border-white/20">
              <div className="text-center">
                <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
                }}>
                  POINTS
                </div>
                <div className="text-4xl font-black text-white tabular-nums" style={{
                  fontFamily: "'Chakra Petch', 'Roboto Condensed', 'Inter', monospace",
                  textShadow: '0 0 15px rgba(255,255,255,0.4), 2px 2px 6px rgba(0,0,0,0.9)'
                }}>
                  {totalScore.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Right: Hashtag */}
            <div className="flex-shrink-0">
              <div className="text-center">
                <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
                }}>
                  BIB
                </div>
                <div className="text-2xl font-black text-white" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  textShadow: '0 0 10px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)'
                }}>
                  #{currentClimber.bib_number}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayLayout>
  )
}

export default BoulderCurrentOverlay

