import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import OverlayLayout from '../components/OverlayLayout'

/**
 * BoulderTimerOverlay Component - Live Timer Display for OBS
 * 
 * Displays the live boulder timer countdown from the boulder timer system.
 * Connects to /boulder socket namespace to receive real-time timer updates.
 */
function BoulderTimerOverlay() {
  const [searchParams] = useSearchParams()
  const position = searchParams.get('position') || 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  
  const [timerState, setTimerState] = useState({
    phase: 'IDLE', // IDLE, CLIMBING, REST
    timeLeft: 0,
    isPaused: false,
    config: {
      climbDuration: 240,
      restDuration: 10,
      warningTime: 60,
      countdownTime: 5
    }
  })
  
  const socketRef = useRef(null)

  useEffect(() => {
    // Connect to boulder timer namespace
    socketRef.current = io('/boulder')

    // Listen for timer sync events
    socketRef.current.on('sync-time', (data) => {
      setTimerState({
        phase: data.phase,
        timeLeft: data.timeLeft,
        isPaused: data.isPaused,
        config: data.config || timerState.config
      })
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Get position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }[position] || 'top-4 right-4'

  // Get phase display info
  const getPhaseInfo = () => {
    if (timerState.phase === 'IDLE') {
      return { label: 'READY', color: 'text-white/80', bgColor: 'bg-white/20' }
    } else if (timerState.phase === 'CLIMBING') {
      if (timerState.isPaused) {
        return { label: 'PAUSED', color: 'text-yellow-200', bgColor: 'bg-yellow-500/30' }
      }
      // Check if warning or danger time
      if (timerState.timeLeft <= 10 && timerState.timeLeft > 0) {
        return { label: 'CLIMBING', color: 'text-red-200', bgColor: 'bg-red-500/30' }
      } else if (timerState.timeLeft <= timerState.config.warningTime && timerState.timeLeft > 10) {
        return { label: 'CLIMBING', color: 'text-yellow-200', bgColor: 'bg-yellow-500/30' }
      }
      return { label: 'CLIMBING', color: 'text-white', bgColor: 'bg-white/20' }
    } else if (timerState.phase === 'REST') {
      return { label: 'REST', color: 'text-white/90', bgColor: 'bg-white/20' }
    }
    return { label: 'READY', color: 'text-white/80', bgColor: 'bg-white/20' }
  }

  const phaseInfo = getPhaseInfo()
  const isDanger = timerState.phase === 'CLIMBING' && timerState.timeLeft <= 10 && timerState.timeLeft > 0

  return (
    <OverlayLayout>
      <div className={`fixed ${positionClasses} z-50`}>
        {/* Main Container - Teal/Cyan Gradient (Same as Leaderboard & Current) */}
        <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 rounded-xl px-6 py-4 shadow-2xl overflow-hidden min-w-[220px]">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Phase Label */}
            <div className="mb-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${phaseInfo.bgColor} border border-white/30`}>
                <div className={`w-2 h-2 rounded-full ${phaseInfo.color.replace('text-', 'bg-')} ${timerState.phase === 'CLIMBING' && !timerState.isPaused ? 'animate-pulse' : ''}`}></div>
                <span className={`text-xs font-bold ${phaseInfo.color} uppercase tracking-wider`} style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  letterSpacing: '0.1em',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {phaseInfo.label}
                </span>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div 
                className={`text-5xl font-black tabular-nums mb-2 ${isDanger ? 'text-red-200 animate-pulse' : 'text-white'}`}
                style={{
                  fontFamily: "'Chakra Petch', 'Roboto Condensed', 'Inter', monospace",
                  textShadow: isDanger 
                    ? '0 0 20px rgba(254,202,202,0.8), 2px 2px 4px rgba(0,0,0,0.9)'
                    : '0 0 15px rgba(255,255,255,0.4), 2px 2px 6px rgba(0,0,0,0.9)',
                  letterSpacing: '0.05em'
                }}
              >
                {formatTime(timerState.timeLeft)}
              </div>
              
              {/* Status Info */}
              {timerState.phase === 'CLIMBING' && !timerState.isPaused && (
                <div className="text-xs text-white/80" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {timerState.timeLeft <= timerState.config.countdownTime && timerState.timeLeft > 0
                    ? `⏰ ${timerState.timeLeft}s remaining`
                    : timerState.timeLeft <= timerState.config.warningTime
                    ? '⚠️ Warning'
                    : 'Time Remaining'}
                </div>
              )}
              
              {timerState.phase === 'REST' && (
                <div className="text-xs text-white/90" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  Next Climber
                </div>
              )}
              
              {timerState.isPaused && (
                <div className="text-xs text-yellow-200" style={{
                  fontFamily: "'Roboto Condensed', 'Inter', sans-serif",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  ⏸ Paused
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OverlayLayout>
  )
}

export default BoulderTimerOverlay

