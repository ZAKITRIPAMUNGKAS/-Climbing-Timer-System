import { useState, useEffect, useRef, useMemo } from 'react'
import { io } from 'socket.io-client'
import OverlayLayout from '../components/OverlayLayout'

/**
 * SpeedOverlay Component - IFSC Broadcast Style Lower Third
 * 
 * Horizontal lower third banner overlay for speed climbing
 * - Left Wing (Climber A) | Center Badge | Right Wing (Climber B)
 * - Angled/skewed edges connecting to center
 * - Layered design: Base Layer (Name Bar) + Top Layer (Time Bar)
 * - Green "W" indicator for winner
 */
function SpeedOverlay() {
  const [raceState, setRaceState] = useState(null)
  const [competition, setCompetition] = useState(null)
  const [climbers, setClimbers] = useState([]) // Store climbers data for team lookup
  const [previousTimeA, setPreviousTimeA] = useState(null)
  const [previousTimeB, setPreviousTimeB] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io()

    // Listen for race state updates
    socketRef.current.on('race-state', (state) => {
      console.log('[SPEED OVERLAY] Race state updated:', state)
      setRaceState(state)
      
      // Fetch previous time when in countdown/armed and athleteId is available
      if ((state.matchStatus === 'COUNTDOWN' || state.matchStatus === 'ARMED') && competition?.id) {
        if (state.laneA?.athleteId) {
          // Always fetch to update if athlete changes
          fetchPreviousTime('A', state.laneA.athleteId, competition.id)
        }
        if (state.laneB?.athleteId) {
          // Always fetch to update if athlete changes
          fetchPreviousTime('B', state.laneB.athleteId, competition.id)
        }
      }
      
      // Clear previous time when match status changes away from countdown
      if (state.matchStatus !== 'COUNTDOWN' && state.matchStatus !== 'ARMED') {
        setPreviousTimeA(null)
        setPreviousTimeB(null)
      }
    })

    // Listen for competition updates
    socketRef.current.on('speed-competition-updated', (data) => {
      console.log('[SPEED OVERLAY] Competition updated event received:', data)
      const urlParams = new URLSearchParams(window.location.search)
      const competitionId = urlParams.get('competition')
      if (competitionId && data.competition_id === parseInt(competitionId)) {
        console.log('[SPEED OVERLAY] Re-fetching competition due to update event')
        fetchCompetition(competitionId)
      }
    })

    // Fetch competition data from URL params or try to get active competition
    const urlParams = new URLSearchParams(window.location.search)
    const competitionId = urlParams.get('competition')
    
    if (competitionId) {
      console.log('[SPEED OVERLAY] Initial load with competition ID:', competitionId)
      fetchCompetition(competitionId)
      fetchClimbers(competitionId)
    } else {
      // Try to get active speed competition
      console.log('[SPEED OVERLAY] No competition ID in URL, fetching active competition')
      fetchActiveCompetition()
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('speed-competition-updated')
        socketRef.current.disconnect()
      }
    }
  }, [])

  const fetchCompetition = async (competitionId) => {
    try {
      console.log('[SPEED OVERLAY] Fetching competition:', competitionId)
      const response = await fetch(`/api/speed-competitions/${competitionId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('[SPEED OVERLAY] Competition loaded:', data.name, 'Status:', data.status)
        setCompetition(data)
      } else {
        console.error('[SPEED OVERLAY] Failed to fetch competition:', response.status)
      }
    } catch (error) {
      console.error('[SPEED OVERLAY] Error fetching competition:', error)
    }
  }

  const fetchActiveCompetition = async () => {
    try {
      console.log('[SPEED OVERLAY] Fetching active competition...')
      const response = await fetch('/api/speed-competitions/active')
      if (response.ok) {
        const data = await response.json()
        console.log('[SPEED OVERLAY] Active competition loaded:', data.name, 'ID:', data.id)
        setCompetition(data)
        if (data.id) {
          fetchClimbers(data.id)
        }
      } else {
        console.error('[SPEED OVERLAY] Failed to fetch active competition:', response.status)
      }
    } catch (error) {
      console.error('[SPEED OVERLAY] Error fetching active competition:', error)
    }
  }

  const fetchClimbers = async (competitionId) => {
    try {
      console.log('[SPEED OVERLAY] Fetching climbers for competition:', competitionId)
      const response = await fetch(`/api/speed-competitions/${competitionId}/climbers`)
      if (response.ok) {
        const data = await response.json()
        console.log('[SPEED OVERLAY] Loaded climbers:', data.length, 'climbers')
        setClimbers(data)
      } else {
        console.error('[SPEED OVERLAY] Failed to fetch climbers:', response.status)
      }
    } catch (error) {
      console.error('[SPEED OVERLAY] Error fetching climbers:', error)
    }
  }

  const fetchPreviousTime = async (lane, athleteId, competitionId) => {
    if (!competitionId || !athleteId) return
    
    try {
      console.log('[SPEED OVERLAY] Fetching previous time for lane', lane, 'athlete', athleteId)
      
      // Try to get from qualification first
      const qualResponse = await fetch(`/api/speed-competitions/${competitionId}/qualification`)
      if (qualResponse.ok) {
        const qualScores = await qualResponse.json()
        const climberScore = qualScores.find(s => s.climber_id === athleteId)
        
        if (climberScore) {
          // Get the best time from lane A or B based on lane
          let bestTime = null
          if (lane === 'A' && climberScore.lane_a_time && climberScore.lane_a_status === 'VALID') {
            bestTime = climberScore.lane_a_time
          } else if (lane === 'B' && climberScore.lane_b_time && climberScore.lane_b_status === 'VALID') {
            bestTime = climberScore.lane_b_time
          }
          
          if (bestTime) {
            const formatTime = (seconds) => {
              const mins = Math.floor(seconds / 60)
              const secs = seconds % 60
              const wholeSecs = Math.floor(secs)
              const ms = Math.floor((secs - wholeSecs) * 1000)
              return `${String(mins).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
            }
            
            if (lane === 'A') {
              setPreviousTimeA(formatTime(bestTime))
            } else {
              setPreviousTimeB(formatTime(bestTime))
            }
            console.log('[SPEED OVERLAY] Found previous time from qualification:', formatTime(bestTime))
            return
          }
        }
      }
      
      // If not found in qualification, try finals matches
      const finalsResponse = await fetch(`/api/speed-competitions/${competitionId}/finals`)
      if (finalsResponse.ok) {
        const finalsMatches = await finalsResponse.json()
        
        // Find the best time from previous runs in finals
        let bestTime = null
        for (const match of finalsMatches) {
          if (match.climber_a_id === athleteId) {
            // Check run1 (Lane A) and run2 (Lane B)
            if (lane === 'A' && match.climber_a_run1_time && match.climber_a_run1_status === 'VALID') {
              const time = parseFloat(match.climber_a_run1_time)
              if (!bestTime || time < bestTime) {
                bestTime = time
              }
            } else if (lane === 'B' && match.climber_a_run2_time && match.climber_a_run2_status === 'VALID') {
              const time = parseFloat(match.climber_a_run2_time)
              if (!bestTime || time < bestTime) {
                bestTime = time
              }
            }
          } else if (match.climber_b_id === athleteId) {
            // Check run1 (Lane B) and run2 (Lane A)
            if (lane === 'B' && match.climber_b_run1_time && match.climber_b_run1_status === 'VALID') {
              const time = parseFloat(match.climber_b_run1_time)
              if (!bestTime || time < bestTime) {
                bestTime = time
              }
            } else if (lane === 'A' && match.climber_b_run2_time && match.climber_b_run2_status === 'VALID') {
              const time = parseFloat(match.climber_b_run2_time)
              if (!bestTime || time < bestTime) {
                bestTime = time
              }
            }
          }
        }
        
        if (bestTime) {
          const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            const wholeSecs = Math.floor(secs)
            const ms = Math.floor((secs - wholeSecs) * 1000)
            return `${String(mins).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
          }
          
          if (lane === 'A') {
            setPreviousTimeA(formatTime(bestTime))
          } else {
            setPreviousTimeB(formatTime(bestTime))
          }
          console.log('[SPEED OVERLAY] Found previous time from finals:', formatTime(bestTime))
        }
      }
    } catch (error) {
      console.error('[SPEED OVERLAY] Error fetching previous time:', error)
    }
  }

  // Extract clean name (without team in parentheses) - Helper function
  const extractName = (athleteName) => {
    if (!athleteName) return ''
    return athleteName.replace(/\s*\([^)]+\)\s*$/, '').toUpperCase().trim()
  }

  // Get team from climbers list by matching name
  const getTeamFromClimbers = (athleteName) => {
    if (!athleteName || !climbers.length) {
      console.log('[SPEED OVERLAY] Cannot get team - no athleteName or climbers:', { athleteName, climbersCount: climbers.length })
      return null
    }
    
    console.log('[SPEED OVERLAY] Looking for team for:', athleteName, 'in', climbers.length, 'climbers')
    
    // Try exact match first (case insensitive)
    const exactMatch = climbers.find(c => {
      const cName = c.name?.toUpperCase().trim()
      const aName = athleteName.toUpperCase().trim()
      return cName === aName
    })
    if (exactMatch) {
      console.log('[SPEED OVERLAY] Found exact match:', exactMatch.name, 'Team:', exactMatch.team)
      return exactMatch.team || null
    }
    
    // Try partial match (in case name has team in parentheses)
    const cleanName = extractName(athleteName)
    if (cleanName) {
      const partialMatch = climbers.find(c => {
        const climberName = c.name?.toUpperCase().trim() || ''
        return climberName === cleanName || 
               climberName.includes(cleanName) || 
               cleanName.includes(climberName) ||
               climberName.replace(/\s+/g, ' ') === cleanName.replace(/\s+/g, ' ')
      })
      if (partialMatch) {
        console.log('[SPEED OVERLAY] Found partial match:', partialMatch.name, 'Team:', partialMatch.team)
        return partialMatch.team || null
      }
    }
    
    console.log('[SPEED OVERLAY] No team found for:', athleteName)
    return null
  }

  // Determine winner
  const isFinished = raceState?.matchStatus === 'FINISHED'
  const laneAFinished = raceState?.laneA?.status === 'FINISHED'
  const laneBFinished = raceState?.laneB?.status === 'FINISHED'
  
  // Winner is determined by lower time when both finished
  let isAWinner = false
  let isBWinner = false
  
  if (isFinished && laneAFinished && laneBFinished) {
    const timeA = parseTimeToSeconds(raceState.laneA.finalDuration)
    const timeB = parseTimeToSeconds(raceState.laneB.finalDuration)
    
    if (timeA < timeB && timeA > 0) {
      isAWinner = true
    } else if (timeB < timeA && timeB > 0) {
      isBWinner = true
    }
  }

  // Parse time from "MM:SS.mmm" to seconds
  function parseTimeToSeconds(timeStr) {
    if (!timeStr || timeStr === '00:00.000' || timeStr === '--:--.---') return 0
    const parts = timeStr.split(':')
    if (parts.length !== 2) return 0
    const minutes = parseInt(parts[0]) || 0
    const secParts = parts[1].split('.')
    const seconds = parseInt(secParts[0]) || 0
    const milliseconds = parseInt(secParts[1]) || 0
    return minutes * 60 + seconds + milliseconds / 1000
  }

  // Format time for display (SS.mmm format for broadcast)
  function formatTimeBroadcast(seconds) {
    if (!seconds || seconds === 0) return '--.---'
    const secs = Math.floor(seconds)
    const ms = Math.floor((seconds - secs) * 1000)
    return `${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
  }

  // Format reaction time (small, e.g., 0.178)
  function formatReactionTime(seconds) {
    if (!seconds || seconds === 0) return '0.000'
    return seconds.toFixed(3)
  }

  // Calculate reaction time (time from global start to lane start)
  const getReactionTime = (lane) => {
    if (!raceState?.globalStartTime || !raceState?.[lane]?.startTime) return 0
    const reaction = (raceState[lane].startTime - raceState.globalStartTime) / 1000
    return reaction > 0 ? reaction : 0
  }

  // Extract team from athlete name if in format "Name (Team)"
  const extractTeam = (athleteName) => {
    if (!athleteName) return null
    const match = athleteName.match(/\(([^)]+)\)/)
    return match ? match[1] : null
  }


  // Get climber data - use useMemo to recalculate when dependencies change
  const athleteNameA = raceState?.laneA?.athleteName || raceState?.laneA?.name || ''
  const athleteNameB = raceState?.laneB?.athleteName || raceState?.laneB?.name || ''
  
  // Re-fetch climbers when race state has athlete names but climbers data is missing
  useEffect(() => {
    if ((athleteNameA || athleteNameB) && climbers.length === 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const competitionId = urlParams.get('competition')
      if (competitionId) {
        console.log('[SPEED OVERLAY] Re-fetching climbers due to athlete names in race state')
        fetchClimbers(competitionId)
      } else if (competition?.id) {
        console.log('[SPEED OVERLAY] Re-fetching climbers using competition ID from state')
        fetchClimbers(competition.id)
      }
    }
  }, [athleteNameA, athleteNameB, climbers.length, competition?.id])
  
  // Debug logging
  useEffect(() => {
    console.log('[SPEED OVERLAY] Current state:', {
      hasRaceState: !!raceState,
      athleteNameA,
      athleteNameB,
      hasCompetition: !!competition,
      competitionName: competition?.name,
      competitionId: competition?.id,
      climbersCount: climbers.length,
      laneATeam: raceState?.laneA?.team,
      laneBTeam: raceState?.laneB?.team
    })
  }, [raceState, athleteNameA, athleteNameB, competition, climbers])
  
  // Try multiple sources for team: from parentheses, from raceState, or from climbers database
  // Recalculate when climbers data changes
  const teamA = useMemo(() => {
    const fromParentheses = extractTeam(athleteNameA)
    const fromRaceState = raceState?.laneA?.team
    
    // Lookup from database
    let fromDatabase = null
    if (athleteNameA && climbers.length > 0) {
      // Try exact match first (case insensitive, trimmed)
      const exactMatch = climbers.find(c => {
        const cName = c.name?.toUpperCase().trim()
        const aName = athleteNameA.toUpperCase().trim()
        return cName === aName
      })
      if (exactMatch?.team) {
        fromDatabase = exactMatch.team
        console.log('[SPEED OVERLAY] Found exact match for Team A:', exactMatch.name, '->', exactMatch.team)
      } else {
        // Try partial match (remove team from parentheses first)
        const cleanName = extractName(athleteNameA)
        if (cleanName) {
          const partialMatch = climbers.find(c => {
            const climberName = c.name?.toUpperCase().trim() || ''
            const cleanClimberName = extractName(c.name || '')?.toUpperCase().trim() || ''
            return climberName === cleanName || 
                   cleanClimberName === cleanName ||
                   climberName.includes(cleanName) || 
                   cleanName.includes(climberName) ||
                   cleanClimberName.includes(cleanName) ||
                   cleanName.includes(cleanClimberName)
          })
          if (partialMatch?.team) {
            fromDatabase = partialMatch.team
            console.log('[SPEED OVERLAY] Found partial match for Team A:', partialMatch.name, '->', partialMatch.team)
          } else {
            console.log('[SPEED OVERLAY] No match found for Team A. Athlete name:', athleteNameA, 'Available climbers:', climbers.map(c => c.name))
          }
        }
      }
    }
    
    const result = fromParentheses || fromRaceState || fromDatabase || null
    console.log('[SPEED OVERLAY] Team A lookup:', { athleteNameA, fromParentheses, fromRaceState, fromDatabase, result })
    return result
  }, [athleteNameA, raceState?.laneA?.team, climbers])
  
  const teamB = useMemo(() => {
    const fromParentheses = extractTeam(athleteNameB)
    const fromRaceState = raceState?.laneB?.team
    
    // Lookup from database
    let fromDatabase = null
    if (athleteNameB && climbers.length > 0) {
      // Try exact match first (case insensitive, trimmed)
      const exactMatch = climbers.find(c => {
        const cName = c.name?.toUpperCase().trim()
        const aName = athleteNameB.toUpperCase().trim()
        return cName === aName
      })
      if (exactMatch?.team) {
        fromDatabase = exactMatch.team
        console.log('[SPEED OVERLAY] Found exact match for Team B:', exactMatch.name, '->', exactMatch.team)
      } else {
        // Try partial match (remove team from parentheses first)
        const cleanName = extractName(athleteNameB)
        if (cleanName) {
          const partialMatch = climbers.find(c => {
            const climberName = c.name?.toUpperCase().trim() || ''
            const cleanClimberName = extractName(c.name || '')?.toUpperCase().trim() || ''
            return climberName === cleanName || 
                   cleanClimberName === cleanName ||
                   climberName.includes(cleanName) || 
                   cleanName.includes(climberName) ||
                   cleanClimberName.includes(cleanName) ||
                   cleanName.includes(cleanClimberName)
          })
          if (partialMatch?.team) {
            fromDatabase = partialMatch.team
            console.log('[SPEED OVERLAY] Found partial match for Team B:', partialMatch.name, '->', partialMatch.team)
          } else {
            console.log('[SPEED OVERLAY] No match found for Team B. Athlete name:', athleteNameB, 'Available climbers:', climbers.map(c => c.name))
          }
        }
      }
  }

    const result = fromParentheses || fromRaceState || fromDatabase || null
    console.log('[SPEED OVERLAY] Team B lookup:', { athleteNameB, fromParentheses, fromRaceState, fromDatabase, result })
    return result
  }, [athleteNameB, raceState?.laneB?.team, climbers])

  const climberA = {
    name: extractName(athleteNameA) || 'CLIMBER A',
    team: teamA,
    pb: raceState?.laneA?.personalBest || null,
    reactionTime: getReactionTime('laneA'),
    finalTime: parseTimeToSeconds(raceState?.laneA?.finalDuration),
    isWinner: isAWinner,
    previousTime: previousTimeA
  }

  const climberB = {
    name: extractName(athleteNameB) || 'CLIMBER B',
    team: teamB,
    pb: raceState?.laneB?.personalBest || null,
    reactionTime: getReactionTime('laneB'),
    finalTime: parseTimeToSeconds(raceState?.laneB?.finalDuration),
    isWinner: isBWinner,
    previousTime: previousTimeB
  }

  // Re-fetch competition periodically to ensure data is up-to-date
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const competitionId = urlParams.get('competition')
    
    if (competitionId) {
      // Re-fetch competition every 5 seconds to ensure data is up-to-date
      const interval = setInterval(() => {
        console.log('[SPEED OVERLAY] Re-fetching competition data...')
        fetchCompetition(competitionId)
      }, 5000)
      
      return () => clearInterval(interval)
    } else {
      // Re-fetch active competition every 5 seconds
      const interval = setInterval(() => {
        console.log('[SPEED OVERLAY] Re-fetching active competition data...')
        fetchActiveCompetition()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [])

  // Match info from competition data
  const matchInfo = useMemo(() => {
    if (!competition || !competition.name) {
      console.log('[SPEED OVERLAY] No competition data, using defaults')
      // Try to get competition ID from URL and fetch again
      const urlParams = new URLSearchParams(window.location.search)
      const competitionId = urlParams.get('competition')
      if (competitionId) {
        console.log('[SPEED OVERLAY] Competition missing, re-fetching...')
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          fetchCompetition(competitionId)
        }, 100)
      }
      return {
        category: "SPEED CLIMBING",
        round: "QUALIFICATION"
      }
    }

    // Determine category from competition name or default
    const category = competition.name?.toUpperCase().trim() || "SPEED CLIMBING"
    
    // Determine round from competition status
    let round = "QUALIFICATION"
    if (competition.status === 'finals') {
      round = "FINALS"
    } else if (competition.status === 'finished') {
      round = "FINALS"
    }

    console.log('[SPEED OVERLAY] Match info:', { category, round, competitionName: competition.name, status: competition.status })
    return {
      category: category,
      round: round
    }
  }, [competition])

  // Show previous time during countdown
  const showPreviousTime = raceState?.matchStatus === 'COUNTDOWN' || raceState?.matchStatus === 'ARMED'

  return (
    <OverlayLayout>
      <div className="fixed bottom-10 left-0 right-0 w-full z-50 flex flex-col items-center justify-center gap-2">
        
        {/* Lower Third Banner Container */}
        <div className="relative w-[90%] max-w-7xl" style={{ height: '120px' }}>
          <div className="relative flex items-stretch h-full">
            
            {/* LEFT WING - Climber A */}
            <ClimberWing 
              climber={climberA}
              position="left"
              showPreviousTime={showPreviousTime}
            />

            {/* CENTER BADGE - Match Info */}
            <CenterBadge matchInfo={matchInfo} />

            {/* RIGHT WING - Climber B */}
            <ClimberWing 
              climber={climberB}
              position="right"
              showPreviousTime={showPreviousTime}
            />

          </div>
        </div>
      </div>
    </OverlayLayout>
  )
}

/**
 * Climber Wing Component - Left or Right
 * Contains two layers: Base Layer (Name Bar) and Top Layer (Time Bar)
 */
function ClimberWing({ climber, position, showPreviousTime = false }) {
  const isLeft = position === 'left'
  
  // Format previous time from MM:SS.mmm to SS.mmm for display
  const formatPreviousTime = (timeStr) => {
    if (!timeStr) return null
    // Convert MM:SS.mmm to SS.mmm
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const secParts = parts[1].split('.')
      const seconds = parseInt(secParts[0]) || 0
      const ms = secParts[1] || '000'
      const totalSeconds = minutes * 60 + seconds
      return `${String(totalSeconds).padStart(2, '0')}.${ms}`
    }
    return timeStr
  }
  
  const previousTimeFormatted = climber.previousTime ? formatPreviousTime(climber.previousTime) : null
  
  return (
    <div className={`relative flex-1 ${isLeft ? 'pr-1' : 'pl-1'}`} style={{ minWidth: '350px' }}>
      {/* Base Layer - Name Bar (Thicker, sits at bottom) */}
      <div className={`absolute bottom-0 ${isLeft ? 'left-0 right-8' : 'right-0 left-8'} h-20`}>
        <div className={`relative h-full bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 ${
          isLeft ? 'skew-x-[-12deg]' : 'skew-x-[12deg]'
        } shadow-2xl`}
        style={{
          clipPath: isLeft 
            ? 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%)'
            : 'polygon(20px 0, 100% 0, 100% 100%, 0 100%)'
        }}>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          
          {/* Content - Name, Team, PB */}
          <div className={`relative h-full flex flex-col ${isLeft ? 'items-end pr-8' : 'items-start pl-8'} justify-center gap-1`}>
            {isLeft ? (
              <>
                {/* Name (closest to center) */}
                <div className="text-white text-2xl font-black uppercase tracking-wider" style={{
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  letterSpacing: '0.1em',
                  fontWeight: 900
                }}>
                  {climber.name}
                </div>
                
                {/* Team - Below name */}
                <div className="text-white/95 text-xs font-semibold" style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', sans-serif"
                }}>
                  {climber.team || '-'}
              </div>
              
                {/* PB Time */}
                {climber.pb && (
                  <div className="text-cyan-200 text-xs font-bold tabular-nums mt-1" style={{
                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                    fontFamily: "'Roboto Condensed', monospace"
                  }}>
                    PB {formatTimeBroadcast(climber.pb)}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Name (closest to center) */}
                <div className="text-white text-2xl font-black uppercase tracking-wider" style={{
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  letterSpacing: '0.1em',
                  fontWeight: 900
              }}>
                  {climber.name}
                </div>
                
                {/* Team - Below name */}
                <div className="text-white/95 text-xs font-semibold" style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', sans-serif"
                }}>
                  {climber.team || '-'}
              </div>
              
                {/* PB Time */}
                {climber.pb && (
                  <div className="text-cyan-200 text-xs font-bold tabular-nums mt-1" style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                    fontFamily: "'Roboto Condensed', monospace"
              }}>
                    PB {formatTimeBroadcast(climber.pb)}
                  </div>
                )}
              </>
            )}
          </div>
              </div>
            </div>

      {/* Top Layer - Time Bar (Thinner, sits on top of Base Layer edge) */}
      <div className={`absolute top-0 ${isLeft ? 'left-0 right-12' : 'right-0 left-12'} h-14`}>
        <div className={`relative h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 ${
          isLeft ? 'skew-x-[-12deg]' : 'skew-x-[12deg]'
        } shadow-xl`}
        style={{
          clipPath: isLeft 
            ? 'polygon(0 0, calc(100% - 15px) 0, 100% 100%, 0 100%)'
            : 'polygon(15px 0, 100% 0, 100% 100%, 0 100%)'
        }}>
          {/* Inner glow */}
          <div className={`absolute inset-0 ${
            isLeft 
              ? 'bg-gradient-to-r from-blue-900/40 via-cyan-800/25 to-transparent' 
              : 'bg-gradient-to-l from-blue-900/40 via-cyan-800/25 to-transparent'
          }`}></div>
          
          {/* Content - Reaction Time, W Indicator, Final Time */}
          <div className={`relative h-full flex items-center ${isLeft ? 'justify-end pr-8' : 'justify-start pl-8'} gap-3`}>
            {isLeft ? (
              <>
                {/* Reaction Time */}
                <div className="text-white/75 text-[11px] font-semibold tabular-nums tracking-wide" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', monospace"
                }}>
                  {formatReactionTime(climber.reactionTime)}
                </div>
                
                {/* Win Indicator - Green Box with "W" */}
                {climber.isWinner && (
                  <div className="bg-gradient-to-br from-green-500 to-green-600 px-3 py-1.5 rounded shadow-[0_2px_8px_rgba(34,197,94,0.6)] border border-green-400/50">
                    <span className="text-white font-black text-base leading-none" style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontFamily: "'Roboto Condensed', sans-serif"
                    }}>W</span>
                </div>
              )}
              
                {/* Final Time - Large, Bold */}
                <div className="relative">
                  <div className={`text-[38px] font-black tabular-nums leading-none ${
                    climber.isWinner ? 'text-yellow-300' : 'text-white'
                  }`} style={{
                    textShadow: climber.isWinner 
                      ? '0 0 25px rgba(253, 224, 71, 0.9), 3px 3px 10px rgba(0,0,0,0.95)'
                      : '3px 3px 8px rgba(0,0,0,0.95), 0 0 15px rgba(0,0,0,0.8)',
                    fontFamily: "'Chakra Petch', 'Roboto Condensed', monospace",
                    letterSpacing: '0.08em',
                    fontWeight: 900
                  }}>
                    {formatTimeBroadcast(climber.finalTime)}
                  </div>
                  {/* Previous Time - Behind timer (during countdown) */}
                  {showPreviousTime && previousTimeFormatted && climber.finalTime === 0 && (
                    <div className="absolute inset-0 flex items-center justify-end">
                      <div className="text-[38px] font-black tabular-nums leading-none text-white/30" style={{
                        fontFamily: "'Chakra Petch', 'Roboto Condensed', monospace",
                        letterSpacing: '0.08em',
                        fontWeight: 900,
                        zIndex: -1
                      }}>
                        {previousTimeFormatted}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Final Time - Large, Bold */}
                <div className="relative">
                  <div className={`text-[38px] font-black tabular-nums leading-none ${
                    climber.isWinner ? 'text-yellow-300' : 'text-white'
              }`} style={{
                    textShadow: climber.isWinner 
                      ? '0 0 25px rgba(253, 224, 71, 0.9), 3px 3px 10px rgba(0,0,0,0.95)'
                      : '3px 3px 8px rgba(0,0,0,0.95), 0 0 15px rgba(0,0,0,0.8)',
                    fontFamily: "'Chakra Petch', 'Roboto Condensed', monospace",
                    letterSpacing: '0.08em',
                fontWeight: 900
              }}>
                    {formatTimeBroadcast(climber.finalTime)}
                  </div>
                  {/* Previous Time - Behind timer (during countdown) */}
                  {showPreviousTime && previousTimeFormatted && climber.finalTime === 0 && (
                    <div className="absolute inset-0 flex items-center justify-start">
                      <div className="text-[38px] font-black tabular-nums leading-none text-white/30" style={{
                        fontFamily: "'Chakra Petch', 'Roboto Condensed', monospace",
                        letterSpacing: '0.08em',
                        fontWeight: 900,
                        zIndex: -1
                      }}>
                        {previousTimeFormatted}
                      </div>
                    </div>
                  )}
              </div>
              
                {/* Win Indicator - Green Box with "W" */}
                {climber.isWinner && (
                  <div className="bg-gradient-to-br from-green-500 to-green-600 px-3 py-1.5 rounded shadow-[0_2px_8px_rgba(34,197,94,0.6)] border border-green-400/50">
                    <span className="text-white font-black text-base leading-none" style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontFamily: "'Roboto Condensed', sans-serif"
                    }}>W</span>
                  </div>
                )}
                
                {/* Reaction Time */}
                <div className="text-white/75 text-[11px] font-semibold tabular-nums tracking-wide" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', monospace"
                }}>
                  {formatReactionTime(climber.reactionTime)}
                </div>
              </>
            )}
          </div>
        </div>
              </div>
            </div>
  )
}

/**
 * Center Badge Component - Match Info
 * White/Gold background, slightly raised, skewed borders
 */
function CenterBadge({ matchInfo }) {
  return (
    <div className="relative flex-shrink-0 w-48 z-10">
      {/* Main Badge */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 shadow-2xl border-l-2 border-r-2 border-amber-300/50">
        {/* Metallic shine effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20"></div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 gap-1">
          <div className="text-gray-900 text-xs font-black uppercase tracking-widest" style={{
            textShadow: '1px 1px 2px rgba(255,255,255,0.5)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
            letterSpacing: '0.15em',
            fontWeight: 900
              }}>
            {matchInfo.category}
              </div>
          <div className="text-gray-800 text-sm font-bold uppercase tracking-wide" style={{
            textShadow: '1px 1px 2px rgba(255,255,255,0.5)',
            fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
            letterSpacing: '0.1em',
            fontWeight: 700
          }}>
            {matchInfo.round}
              </div>
            </div>
          </div>
        </div>
  )
}

// Helper functions
function formatReactionTime(seconds) {
  if (!seconds || seconds === 0) return '0.000'
  return seconds.toFixed(3)
}

function formatTimeBroadcast(seconds) {
  if (!seconds || seconds === 0) return '--.---'
  const secs = Math.floor(seconds)
  const ms = Math.floor((seconds - secs) * 1000)
  return `${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export default SpeedOverlay
