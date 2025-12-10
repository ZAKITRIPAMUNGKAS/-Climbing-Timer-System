import React, { useState, useRef, useLayoutEffect } from 'react'
import { Trophy } from 'lucide-react'

/**
 * Format time from seconds (decimal) to MM:SS.mmm format
 */
function formatTimeMMSSmmm(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '-'
  }
  
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const milliseconds = Math.floor((seconds - totalSeconds) * 1000)
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

/**
 * Match Node Component - Displays a single match with two climbers
 */
const MatchNode = React.forwardRef(({ match, onClick, isWinner }, ref) => {
  // Get times - use new two-run structure if available, fallback to old structure
  const aRun1 = match.climber_a_run1_time ? parseFloat(match.climber_a_run1_time) : null
  const aRun2 = match.climber_a_run2_time ? parseFloat(match.climber_a_run2_time) : null
  // Calculate total time if not in database: run1 + run2 (if both valid)
  const aTotal = match.climber_a_total_time ? parseFloat(match.climber_a_total_time) : 
                 (aRun1 !== null && aRun2 !== null && 
                  match.climber_a_run1_status === 'VALID' && 
                  match.climber_a_run2_status === 'VALID' ? 
                  aRun1 + aRun2 : null)
  
  const bRun1 = match.climber_b_run1_time ? parseFloat(match.climber_b_run1_time) : null
  const bRun2 = match.climber_b_run2_time ? parseFloat(match.climber_b_run2_time) : null
  // Calculate total time if not in database: run1 + run2 (if both valid)
  const bTotal = match.climber_b_total_time ? parseFloat(match.climber_b_total_time) : 
                 (bRun1 !== null && bRun2 !== null && 
                  match.climber_b_run1_status === 'VALID' && 
                  match.climber_b_run2_status === 'VALID' ? 
                  bRun1 + bRun2 : null)

  // For BYE matches, climber_a wins automatically (no need to wait for runs)
  // For regular matches, only show winner if BOTH climbers have completed BOTH runs
  const isBYE = !match.climber_b_id
  const aHasBothRuns = aRun1 !== null && aRun2 !== null && 
                       match.climber_a_run1_status === 'VALID' && 
                       match.climber_a_run2_status === 'VALID'
  const bHasBothRuns = bRun1 !== null && bRun2 !== null && 
                       match.climber_b_run1_status === 'VALID' && 
                       match.climber_b_run2_status === 'VALID'
  const bothRunsComplete = isBYE ? true : (aHasBothRuns && bHasBothRuns) // BYE can win immediately
  
  // Only determine winner if both runs are complete (or if BYE)
  const winnerId = bothRunsComplete ? match.winner_id : null
  const isAWinner = bothRunsComplete && winnerId === match.climber_a_id
  const isBWinner = bothRunsComplete && winnerId === match.climber_b_id

  return (
    <div 
      ref={ref}
      id={`match-${match.id}`}
      className="match-wrapper"
    >
      {/* Match Card */}
      <div 
        onClick={onClick}
        className="match-card bg-zinc-900 border-2 border-zinc-700 rounded-sm p-2 sm:p-3 cursor-pointer hover:border-[#FFB800]/50 hover:shadow-lg transition-all duration-200 relative z-10"
      >
      {/* Stage Badge */}
      <div className="text-center mb-1.5 sm:mb-2">
        <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-[#121212] border border-zinc-800 rounded-sm text-[10px] sm:text-xs font-semibold text-[#FFB800] uppercase">
          {match.stage}
        </span>
      </div>

      {/* Climber A Row */}
      <div className={`mb-1.5 sm:mb-2 p-1.5 sm:p-2 rounded-sm ${isAWinner ? 'bg-green-500/20 border border-green-500/30' : 'bg-zinc-800/50 border border-zinc-700/50'}`}>
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-xs sm:text-sm truncate ${isAWinner ? 'text-green-400' : 'text-zinc-100'}`}>
              {match.climber_a_name}
              {match.climber_a_rank && (
                <span className="ml-1 text-[10px] sm:text-xs text-[#FFB800] font-normal">(#{match.climber_a_rank})</span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 truncate">
              #{match.climber_a_bib} {match.climber_a_team ? `• ${match.climber_a_team}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs flex-shrink-0">
            {aRun1 !== null && (
              <span className={`tabular-nums ${isAWinner ? 'text-green-300' : 'text-zinc-400'}`}>
                {formatTimeMMSSmmm(aRun1)}
              </span>
            )}
            {aRun1 !== null && aRun2 !== null && (
              <span className="text-zinc-600">+</span>
            )}
            {aRun2 !== null && (
              <span className={`tabular-nums ${isAWinner ? 'text-green-300' : 'text-zinc-400'}`}>
                {formatTimeMMSSmmm(aRun2)}
              </span>
            )}
            {aTotal !== null && aTotal > 0 && (
              <span className={`ml-1 font-bold tabular-nums ${isAWinner ? 'text-green-400' : 'text-zinc-300'}`}>
                = {formatTimeMMSSmmm(aTotal)}
              </span>
            )}
            {aRun1 !== null && aRun2 !== null && (aTotal === null || aTotal === 0) && (
              <span className={`ml-1 font-bold tabular-nums ${isAWinner ? 'text-green-400' : 'text-zinc-300'}`}>
                = {formatTimeMMSSmmm((aRun1 + aRun2))}
              </span>
            )}
            {!aRun1 && !aRun2 && (
              <span className="text-zinc-600">-</span>
            )}
          </div>
        </div>
      </div>

      {/* VS Divider */}
      <div className="text-center text-zinc-600 text-[10px] sm:text-xs font-semibold my-0.5 sm:my-1">VS</div>

      {/* Climber B Row */}
      <div className={`p-1.5 sm:p-2 rounded-sm ${isBWinner ? 'bg-green-500/20 border border-green-500/30' : 'bg-zinc-800/50 border border-zinc-700/50'}`}>
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-xs sm:text-sm truncate ${isBWinner ? 'text-green-400' : 'text-zinc-100'}`}>
              {match.climber_b_name || 'BYE'}
              {match.climber_b_rank && (
                <span className="ml-1 text-[10px] sm:text-xs text-[#FFB800] font-normal">(#{match.climber_b_rank})</span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 truncate">
              {match.climber_b_bib ? `#${match.climber_b_bib}` : ''} {match.climber_b_team ? `• ${match.climber_b_team}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs flex-shrink-0">
            {bRun1 !== null && (
              <span className={`tabular-nums ${isBWinner ? 'text-green-300' : 'text-zinc-400'}`}>
                {formatTimeMMSSmmm(bRun1)}
              </span>
            )}
            {bRun1 !== null && bRun2 !== null && (
              <span className="text-zinc-600">+</span>
            )}
            {bRun2 !== null && (
              <span className={`tabular-nums ${isBWinner ? 'text-green-300' : 'text-zinc-400'}`}>
                {formatTimeMMSSmmm(bRun2)}
              </span>
            )}
            {bTotal !== null && bTotal > 0 && (
              <span className={`ml-1 font-bold tabular-nums ${isBWinner ? 'text-green-400' : 'text-gray-300'}`}>
                = {formatTimeMMSSmmm(bTotal)}
              </span>
            )}
            {bRun1 !== null && bRun2 !== null && (bTotal === null || bTotal === 0) && (
              <span className={`ml-1 font-bold tabular-nums ${isBWinner ? 'text-green-400' : 'text-gray-300'}`}>
                = {formatTimeMMSSmmm((bRun1 + bRun2))}
              </span>
            )}
            {!bRun1 && !bRun2 && (
              <span className="text-gray-500">-</span>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
})

MatchNode.displayName = "MatchNode"

/**
 * Bracket Round Component - Displays matches for a single round
 */
function BracketRound({ stage, matches, onMatchClick, isLastRound = false, matchRefs }) {
  // Sort matches by match_order
  const sortedMatches = [...matches].sort((a, b) => (a.match_order || 0) - (b.match_order || 0));
  
  return (
    <div className="bracket-column">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="stage-header font-bold text-goldenrod uppercase tracking-wider">{stage}</h3>
        <div className="stage-count text-gray-400 mt-1">
          {matches.length} Match{matches.length !== 1 ? 'es' : ''}
        </div>
      </div>
      {sortedMatches.map((match) => (
        <MatchNode 
          key={match.id} 
          match={match} 
          onClick={() => onMatchClick(match)}
          isWinner={match.winner_id !== null}
          ref={el => {
            if (el && match.id) {
              matchRefs.current[match.id] = el
            }
          }}
        />
      ))}
    </div>
  )
}

/**
 * Speed Bracket View Component - Main tournament bracket visualization
 * Displays matches in a horizontal tournament tree structure with SVG connector lines
 */
function SpeedBracketView({ matches = [], onMatchClick }) {
  const [paths, setPaths] = useState([])
  const containerRef = useRef(null)
  const matchRefs = useRef({})

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-400 text-lg font-semibold">No matches found</p>
        <p className="text-gray-500 text-sm mt-2">Generate bracket first from Manage Competitions</p>
      </div>
    )
  }

  // Group matches by stage
  const matchesByStage = {}
  matches.forEach(match => {
    if (!matchesByStage[match.stage]) {
      matchesByStage[match.stage] = []
    }
    matchesByStage[match.stage].push(match)
  })

  // Define stage order
  const stageOrder = ['Round of 16', 'Quarter Final', 'Semi Final', 'Small Final', 'Big Final']
  const orderedStages = stageOrder.filter(stage => matchesByStage[stage])

  // Recalculate paths on resize or data change
  useLayoutEffect(() => {
    const calculatePaths = () => {
      if (!containerRef.current) return

      const newPaths = []
      const containerRect = containerRef.current.getBoundingClientRect()

      // Group matches by stage
      const matchesByStageLocal = {}
      matches.forEach(match => {
        if (!matchesByStageLocal[match.stage]) {
          matchesByStageLocal[match.stage] = []
        }
        matchesByStageLocal[match.stage].push(match)
      })

      // Define stage order
      const stageOrder = ['Round of 16', 'Quarter Final', 'Semi Final', 'Small Final', 'Big Final']
      const orderedStagesLocal = stageOrder.filter(stage => matchesByStageLocal[stage])

      // Loop through each stage except the last one
      for (let i = 0; i < orderedStagesLocal.length - 1; i++) {
        const currentStage = orderedStagesLocal[i]
        const nextStage = orderedStagesLocal[i + 1]

        const currentMatches = matchesByStageLocal[currentStage]
        const nextMatches = matchesByStageLocal[nextStage]

        if (!currentMatches || !nextMatches) continue

        // Standard bracket logic: 2 matches in current stage -> 1 match in next stage
        currentMatches.forEach((match, index) => {
          // Only draw connector if match has a winner
          if (!match.winner_id) return

          const nextMatchIndex = Math.floor(index / 2)

          if (nextMatchIndex < nextMatches.length) {
            const nextMatch = nextMatches[nextMatchIndex]

            const startEl = matchRefs.current[match.id]
            const endEl = matchRefs.current[nextMatch.id]

            if (startEl && endEl) {
              const startRect = startEl.getBoundingClientRect()
              const endRect = endEl.getBoundingClientRect()

              // Coordinates relative to container
              const startX = startRect.right - containerRect.left
              const startY = startRect.top + (startRect.height / 2) - containerRect.top
              const endX = endRect.left - containerRect.left
              const endY = endRect.top + (endRect.height / 2) - containerRect.top

              // Create Bezier curve
              const controlPoint1X = startX + (endX - startX) / 2
              const controlPoint1Y = startY
              const controlPoint2X = startX + (endX - startX) / 2
              const controlPoint2Y = endY

              const d = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`

              newPaths.push({ d, key: `${match.id}-${nextMatch.id}` })
            }
          }
        })
      }

      setPaths(newPaths)
    }

    // Use setTimeout to ensure all refs are attached
    const timer = setTimeout(() => {
      calculatePaths()
    }, 0)
    
    window.addEventListener('resize', calculatePaths)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculatePaths)
    }
  }, [matches])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .bracket-wrapper {
          padding-top: 40px;
          display: flex;
          justify-content: flex-start;
          gap: 24px;
          width: 100%;
          overflow-x: auto;
          padding-bottom: 40px;
          -webkit-overflow-scrolling: touch;
        }
        
        .bracket-column {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
          min-width: 240px;
          flex-shrink: 0;
        }
        
        .match-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .match-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 280px;
        }
        
        .stage-header {
          font-size: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .stage-count {
          font-size: 0.625rem;
        }
        
        .connector-svg {
          display: block;
        }
        
        .connector-path {
          stroke-width: 1.5;
        }
        
        @media (min-width: 640px) {
          .connector-path {
            stroke-width: 2;
          }
        }
        
        @media (min-width: 640px) {
          .bracket-wrapper {
            padding-top: 60px;
            gap: 40px;
            justify-content: center;
          }
          
          .bracket-column {
            gap: 32px;
            min-width: 260px;
          }
          
          .match-card {
            max-width: 280px;
          }
          
          .stage-header {
            font-size: 0.875rem;
          }
        }
        
        @media (min-width: 768px) {
          .bracket-wrapper {
            padding-top: 80px;
            gap: 60px;
          }
          
          .bracket-column {
            gap: 40px;
            min-width: 300px;
          }
          
          .match-card {
            max-width: 300px;
          }
          
          .stage-header {
            font-size: 1rem;
          }
        }
        
        @media (min-width: 1024px) {
          .bracket-wrapper {
            gap: 80px;
          }
          
          .bracket-column {
            gap: 50px;
            min-width: 320px;
          }
          
          .match-card {
            max-width: 320px;
          }
        }
        
        @media (min-width: 1280px) {
          .bracket-column {
            min-width: 340px;
          }
          
          .match-card {
            max-width: 340px;
          }
        }
      `}} />
      <div className="bg-[#121212] border border-zinc-800 rounded-sm p-4 sm:p-6 overflow-x-auto overflow-y-visible">
        <div className="overflow-x-auto overflow-y-visible pb-8 sm:pb-12 -mx-4 sm:mx-0">
          <div 
            ref={containerRef}
            className="relative min-w-max mx-auto px-4 sm:px-6 md:px-8 py-4 bracket-wrapper"
          >
          {/* SVG Layer for connector lines - Visible on all screen sizes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 connector-svg" style={{ minHeight: '100%' }}>
            {paths.map((p) => (
              <path
                key={p.key}
                d={p.d}
                fill="none"
                stroke="#555"
                strokeWidth="1.5"
                className="connector-path opacity-60"
              />
            ))}
          </svg>

          {/* Bracket Columns */}
          {orderedStages.map((stage, index) => (
            <BracketRound 
              key={stage}
              stage={stage}
              matches={matchesByStage[stage]}
              onMatchClick={onMatchClick}
              isLastRound={index === orderedStages.length - 1}
              matchRefs={matchRefs}
            />
          ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default SpeedBracketView

