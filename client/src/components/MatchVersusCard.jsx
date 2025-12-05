import React from 'react'

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
    return time.toFixed(2);
  };

  const getTimeClass = (time, isLower) => {
    if (time === null) return 'text-gray-500';
    if (isLower) return 'text-green-400 font-bold';
    return 'text-gray-400';
  };

  return (
    <div className="bg-rich-black rounded-xl p-6 border border-white/10 hover:border-goldenrod/30 transition-all duration-200 shadow-2xl">
      {/* Header: Stage Name with Badge */}
      <div className="text-center mb-6">
        <span className="inline-block px-4 py-1.5 bg-gunmetal border border-white/10 rounded-full text-sm font-semibold text-goldenrod uppercase tracking-wider">
          {match.stage}
        </span>
      </div>

      {/* Content: Versus Layout */}
      <div className="flex items-center justify-between gap-8">
        {/* Left: Climber A */}
        <div className={`flex-1 text-center p-4 rounded-lg transition-all duration-200 ${
          isAWinner ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white'
        }`}>
          <div className={`font-bold text-lg mb-1 ${isAWinner ? 'text-green-400' : 'text-white'}`}>
            {match.climber_a_name}
            {match.climber_a_rank && (
              <span className="ml-2 text-xs text-goldenrod font-normal">(#{match.climber_a_rank})</span>
            )}
          </div>
          <div className={`text-sm mb-2 ${isAWinner ? 'text-green-300' : 'text-gray-400'}`}>
            #{match.climber_a_bib} {match.climber_a_team ? `• ${match.climber_a_team}` : ''}
            {match.climber_b_id === null && (
              <span className="ml-2 text-xs text-yellow-400 font-semibold">(BYE)</span>
            )}
          </div>
          {isAWinner && (
            <div className="inline-flex items-center gap-1 text-xs text-green-400 font-bold uppercase tracking-wide mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Winner
            </div>
          )}
        </div>

        {/* Center: Times VS with Divider */}
        <div className="flex flex-col items-center gap-3 min-w-[220px]">
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold tabular-nums ${getTimeClass(timeA, timeA === lowerTime)}`}>
              {match.climber_b_id === null ? 'BYE' : formatTime(timeA, match.status_a)}
            </div>
            <div className="text-gray-500 font-bold text-xl">VS</div>
            <div className={`text-3xl font-bold tabular-nums ${getTimeClass(timeB, timeB === lowerTime)}`}>
              {match.climber_b_id === null ? '—' : formatTime(timeB, match.status_b)}
            </div>
          </div>
          {(match.status_a !== 'VALID' || match.status_b !== 'VALID') && (
            <div className="text-xs text-red-400 font-medium">
              {match.status_a !== 'VALID' && `A: ${match.status_a} `}
              {match.status_b !== 'VALID' && `B: ${match.status_b}`}
            </div>
          )}
        </div>

        {/* Right: Climber B */}
        <div className={`flex-1 text-center p-4 rounded-lg transition-all duration-200 ${
          isBWinner ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white'
        }`}>
          <div className={`font-bold text-lg mb-1 ${isBWinner ? 'text-green-400' : 'text-white'}`}>
            {match.climber_b_name || 'BYE'}
            {match.climber_b_rank && (
              <span className="ml-2 text-xs text-goldenrod font-normal">(#{match.climber_b_rank})</span>
            )}
          </div>
          <div className={`text-sm mb-2 ${isBWinner ? 'text-green-300' : 'text-gray-400'}`}>
            {match.climber_b_bib ? `#${match.climber_b_bib}` : ''} {match.climber_b_team ? `• ${match.climber_b_team}` : ''}
            {match.climber_b_id === null && (
              <span className="ml-2 text-xs text-yellow-400 font-semibold">(Walkover)</span>
            )}
          </div>
          {isBWinner && (
            <div className="inline-flex items-center gap-1 text-xs text-green-400 font-bold uppercase tracking-wide mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
