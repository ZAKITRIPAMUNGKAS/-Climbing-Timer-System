import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import OverlayLayout from '../components/OverlayLayout'

/**
 * SpeedOverlay Component - TV Style Lower Third Bar
 * 
 * Displays a horizontal bar at the bottom of the screen for Speed Climbing.
 * - Left: Climber A Name & Team
 * - Right: Climber B Name & Team
 * - Center: Live Timer
 * - Winner's side turns Green when match finishes
 */
function SpeedOverlay() {
  const [raceState, setRaceState] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io()

    // Listen for race state updates
    socketRef.current.on('race-state', (state) => {
      setRaceState(state)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Determine winner
  const isFinished = raceState?.matchStatus === 'FINISHED'
  const laneAFinished = raceState?.laneA?.status === 'FINISHED'
  const laneBFinished = raceState?.laneB?.status === 'FINISHED'
  
  // Winner is determined by lower time when both finished
  let isAWinner = false
  let isBWinner = false
  
  if (isFinished && laneAFinished && laneBFinished) {
    const timeA = parseFloat(raceState.laneA.finalDuration?.replace(/[^\d.]/g, '')) || Infinity
    const timeB = parseFloat(raceState.laneB.finalDuration?.replace(/[^\d.]/g, '')) || Infinity
    
    if (timeA < timeB) {
      isAWinner = true
    } else if (timeB < timeA) {
      isBWinner = true
    }
  }

  // Format time display
  const formatTime = (duration) => {
    if (!duration || duration === '00:00.000') {
      return '--:--.---'
    }
    return duration
  }

  // Get the main timer (show the faster one if both are running, or the one that's running)
  const getMainTimer = () => {
    if (!raceState) return '00:00.000'
    
    const timeA = raceState.laneA?.finalDuration || '00:00.000'
    const timeB = raceState.laneB?.finalDuration || '00:00.000'
    
    // If both are finished, show the faster time
    if (laneAFinished && laneBFinished) {
      const numA = parseFloat(timeA.replace(/[^\d.]/g, '')) || Infinity
      const numB = parseFloat(timeB.replace(/[^\d.]/g, '')) || Infinity
      return numA < numB ? timeA : timeB
    }
    
    // If one is running, show that one
    if (raceState.laneA?.status === 'RUNNING') return timeA
    if (raceState.laneB?.status === 'RUNNING') return timeB
    
    // If one is finished, show that one
    if (laneAFinished) return timeA
    if (laneBFinished) return timeB
    
    return '00:00.000'
  }

  const getStatusColor = () => {
    if (raceState?.matchStatus === 'RUNNING') return 'text-red-500'
    if (raceState?.matchStatus === 'FINISHED') return 'text-green-400'
    if (raceState?.matchStatus === 'COUNTDOWN') return 'text-yellow-400'
    return 'text-gray-400'
  }

  const getStatusGlow = () => {
    if (raceState?.matchStatus === 'RUNNING') return '0 0 20px rgba(239, 68, 68, 0.6)'
    if (raceState?.matchStatus === 'FINISHED') return '0 0 20px rgba(74, 222, 128, 0.6)'
    return 'none'
  }

  return (
    <OverlayLayout>
      <div className="fixed bottom-0 left-0 right-0 w-full z-50">
        {/* Lower Third Bar - Enhanced Design */}
        <div className="relative bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-md border-t-4 border-goldenrod/60 shadow-2xl">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
          
          {/* Glowing bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-goldenrod to-transparent opacity-60"></div>
          
          <div className="relative flex items-center justify-between px-10 py-6">
            {/* Left: Climber A */}
            <div className={`flex-1 text-left transition-all duration-500 ${
              isAWinner && isFinished 
                ? 'bg-gradient-to-r from-green-500/40 to-green-500/20 px-6 py-3 rounded-xl border-2 border-green-400/50 shadow-lg shadow-green-500/30' 
                : 'px-4'
            }`}>
              {/* Lane indicator badge */}
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-black/40 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
                }}>
                  Lane A
                </span>
              </div>
              
              <div className={`text-3xl font-black mb-2 transition-all duration-300 ${
                isAWinner && isFinished 
                  ? 'text-green-300' 
                  : 'text-white'
              }`} style={{
                textShadow: isAWinner && isFinished
                  ? '0 0 20px rgba(74, 222, 128, 0.8), 2px 2px 8px rgba(0,0,0,0.9)'
                  : '2px 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                letterSpacing: '0.5px'
              }}>
                {raceState?.laneA?.athleteName || 'Climber A'}
              </div>
              
              {/* Time display for each lane */}
              <div className="text-lg font-bold text-gray-300 tabular-nums" style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
              }}>
                {formatTime(raceState?.laneA?.finalDuration || '00:00.000')}
              </div>
            </div>

            {/* Center: Live Timer - Enhanced */}
            <div className="flex-shrink-0 mx-12 text-center relative">
              {/* Pulsing ring for LIVE status */}
              {raceState?.matchStatus === 'RUNNING' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-4 border-red-500/30 rounded-full animate-ping"></div>
                </div>
              )}
              
              <div className={`text-6xl font-black tabular-nums relative z-10 ${
                isFinished ? 'text-yellow-300' : raceState?.matchStatus === 'RUNNING' ? 'text-red-400' : 'text-white'
              }`} style={{
                textShadow: isFinished
                  ? '0 0 30px rgba(253, 224, 71, 0.8), 3px 3px 10px rgba(0,0,0,0.9)'
                  : raceState?.matchStatus === 'RUNNING'
                  ? '0 0 30px rgba(239, 68, 68, 0.8), 3px 3px 10px rgba(0,0,0,0.9)'
                  : '3px 3px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                letterSpacing: '2px',
                fontWeight: 900
              }}>
                {formatTime(getMainTimer())}
              </div>
              
              {/* Status badge */}
              <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 ${
                raceState?.matchStatus === 'RUNNING' 
                  ? 'bg-red-500/20 border-red-400/50' 
                  : raceState?.matchStatus === 'FINISHED'
                  ? 'bg-green-500/20 border-green-400/50'
                  : 'bg-gray-500/20 border-gray-400/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  raceState?.matchStatus === 'RUNNING' ? 'bg-red-400 animate-pulse' 
                  : raceState?.matchStatus === 'FINISHED' ? 'bg-green-400'
                  : 'bg-gray-400'
                }`}></div>
                <span className={`text-xs font-bold uppercase tracking-widest ${getStatusColor()}`} style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  boxShadow: getStatusGlow()
                }}>
                  {raceState?.matchStatus === 'RUNNING' ? '● LIVE' : 
                   raceState?.matchStatus === 'FINISHED' ? '✓ FINISH' : 
                   raceState?.matchStatus === 'COUNTDOWN' ? '⏱ READY' : '⏸ WAITING'}
                </span>
              </div>
            </div>

            {/* Right: Climber B */}
            <div className={`flex-1 text-right transition-all duration-500 ${
              isBWinner && isFinished 
                ? 'bg-gradient-to-r from-green-500/20 to-green-500/40 px-6 py-3 rounded-xl border-2 border-green-400/50 shadow-lg shadow-green-500/30' 
                : 'px-4'
            }`}>
              {/* Lane indicator badge */}
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-black/40 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
                }}>
                  Lane B
                </span>
              </div>
              
              <div className={`text-3xl font-black mb-2 transition-all duration-300 ${
                isBWinner && isFinished 
                  ? 'text-green-300' 
                  : 'text-white'
              }`} style={{
                textShadow: isBWinner && isFinished
                  ? '0 0 20px rgba(74, 222, 128, 0.8), 2px 2px 8px rgba(0,0,0,0.9)'
                  : '2px 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                letterSpacing: '0.5px'
              }}>
                {raceState?.laneB?.athleteName || 'Climber B'}
              </div>
              
              {/* Time display for each lane */}
              <div className="text-lg font-bold text-gray-300 tabular-nums" style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                fontFamily: "'Roboto Condensed', 'Inter', sans-serif"
              }}>
                {formatTime(raceState?.laneB?.finalDuration || '00:00.000')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayLayout>
  )
}

export default SpeedOverlay

