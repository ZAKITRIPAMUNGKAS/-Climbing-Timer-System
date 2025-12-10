import React from 'react'

/**
 * Format time from seconds (decimal) to MM:SS.mmm format
 * @param {number} seconds - Time in seconds (e.g., 1.439)
 * @returns {string} Formatted time (e.g., "00:01.439")
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
 * MatchVersusCard Component - Clean Enterprise White Design
 * 
 * Layout: "Match Card" style
 * - Header: Stage Name (e.g., "Big Final") with badge
 * - Content:
 *   - Left (Climber A): Name & Team. (Text Green if Winner)
 *   - Center: Time A VS Time B (with divider)
 *   - Right (Climber B): Name & Team. (Text Green if Winner)
 * 
 * Logic: The lower time must be BOLD GREEN. The loser time is standard gray.
 */
function MatchVersusCard({ match }) {
  const winnerId = match.winner_id;
  const isAWinner = winnerId === match.climber_a_id;
  const isBWinner = winnerId === match.climber_b_id;
  const timeA = match.time_a ? parseFloat(match.time_a) : null;
  const timeB = match.time_b ? parseFloat(match.time_b) : null;
  
  // Determine which time is lower (winner)
  const lowerTime = timeA !== null && timeB !== null 
    ? (timeA < timeB ? timeA : timeB)
    : null;
  const higherTime = timeA !== null && timeB !== null
    ? (timeA > timeB ? timeB : timeA)
    : null;

  const formatTime = (time, status) => {
    if (time === null || status !== 'VALID') {
      return status;
    }
    return formatTimeMMSSmmm(time);
  };

  const getTimeClass = (time, isLower) => {
    if (time === null) return 'text-gray-500';
    if (isLower) return 'text-green-400 font-bold';
    return 'text-gray-400';
  };

  return (
    <div className="bg-rich-black rounded-xl p-4 sm:p-5 lg:p-6 border border-white/10 hover:border-goldenrod/30 transition-all duration-200 shadow-2xl">
      {/* Header: Stage Name with Badge */}
      <div className="text-center mb-4 sm:mb-6">
        <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-gunmetal border border-white/10 rounded-full text-xs sm:text-sm font-semibold text-goldenrod uppercase tracking-wider">
          {match.stage}
        </span>
      </div>

      {/* Content: Versus Layout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        {/* Left: Climber A */}
        <div className={`flex-1 text-center p-3 sm:p-4 rounded-lg transition-all duration-200 ${
          isAWinner ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white'
        }`}>
          <div className={`font-bold text-base sm:text-lg mb-1 break-words ${isAWinner ? 'text-green-400' : 'text-white'}`}>
            {match.climber_a_name}
            {match.climber_a_rank && (
              <span className="ml-2 text-xs text-goldenrod font-normal">(#{match.climber_a_rank})</span>
            )}
          </div>
          <div className={`text-xs sm:text-sm mb-2 break-words ${isAWinner ? 'text-green-300' : 'text-gray-400'}`}>
            #{match.climber_a_bib} {match.climber_a_team ? `• ${match.climber_a_team}` : ''}
            {match.climber_b_id === null && (
              <span className="ml-2 text-xs text-yellow-400 font-semibold">(BYE)</span>
            )}
          </div>
          {isAWinner && (
            <div className="inline-flex items-center gap-1 text-xs text-green-400 font-bold uppercase tracking-wide mt-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Winner
            </div>
          )}
        </div>

        {/* Center: Times VS with Divider */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[180px] lg:min-w-[220px] px-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${getTimeClass(timeA, timeA === lowerTime)}`}>
              {match.climber_b_id === null ? 'BYE' : formatTime(timeA, match.status_a)}
            </div>
            <div className="text-gray-500 font-bold text-lg sm:text-xl">VS</div>
            <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${getTimeClass(timeB, timeB === lowerTime)}`}>
              {match.climber_b_id === null ? '—' : formatTime(timeB, match.status_b)}
            </div>
          </div>
          {(match.status_a !== 'VALID' || match.status_b !== 'VALID') && (
            <div className="text-xs text-red-400 font-medium text-center">
              {match.status_a !== 'VALID' && `A: ${match.status_a} `}
              {match.status_b !== 'VALID' && `B: ${match.status_b}`}
            </div>
          )}
        </div>

        {/* Right: Climber B */}
        <div className={`flex-1 text-center p-3 sm:p-4 rounded-lg transition-all duration-200 ${
          isBWinner ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white'
        }`}>
          <div className={`font-bold text-base sm:text-lg mb-1 break-words ${isBWinner ? 'text-green-400' : 'text-white'}`}>
            {match.climber_b_name || 'BYE'}
            {match.climber_b_rank && (
              <span className="ml-2 text-xs text-goldenrod font-normal">(#{match.climber_b_rank})</span>
            )}
          </div>
          <div className={`text-xs sm:text-sm mb-2 break-words ${isBWinner ? 'text-green-300' : 'text-gray-400'}`}>
            {match.climber_b_bib ? `#${match.climber_b_bib}` : ''} {match.climber_b_team ? `• ${match.climber_b_team}` : ''}
            {match.climber_b_id === null && (
              <span className="ml-2 text-xs text-yellow-400 font-semibold">(Walkover)</span>
            )}
          </div>
          {isBWinner && (
            <div className="inline-flex items-center gap-1 text-xs text-green-400 font-bold uppercase tracking-wide mt-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Winner
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchVersusCard
