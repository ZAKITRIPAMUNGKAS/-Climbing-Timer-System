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
 * QualificationCard Component - Clean Enterprise White Design
 * 
 * Layout:
 * - Left: Rank Number (Big font)
 * - Center: Climber Name, Team, Bib Number
 * - Right (Score Block):
 *   - Small text: A: {timeA} | B: {timeB}
 *   - Main Display: Total: {totalTime} (Large, Bold, Blue Color)
 */
function QualificationCard({ score, index }) {
  const isInvalid = score.status === 'INVALID' || score.total_time === null;
  const rankDisplay = score.rank || '-';

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-5 lg:p-6 bg-rich-black rounded-xl shadow-2xl border border-white/10 hover:border-goldenrod/30 transition-all duration-200 ${
      isInvalid ? 'opacity-75' : ''
    }`}>
      {/* Left: Rank Number */}
      <div className="flex items-center justify-center min-w-[60px] sm:min-w-[80px]">
        {score.rank ? (
          <div className="text-3xl sm:text-4xl font-bold text-goldenrod tabular-nums">
            {score.rank}
          </div>
        ) : (
          <div className="text-xl sm:text-2xl font-bold text-gray-500">
            -
          </div>
        )}
      </div>

      {/* Center: Climber Info */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 sm:px-2.5 py-0.5 bg-gunmetal border border-white/10 rounded text-xs font-semibold text-gray-300 tracking-wide">
            #{score.bib_number}
          </span>
        </div>
        <div className="font-bold text-base sm:text-lg text-white mb-0.5 tracking-tight break-words">
          {score.name}
        </div>
        {score.team && (
          <div className="text-xs sm:text-sm text-gray-400 break-words">
            {score.team}
          </div>
        )}
      </div>

      {/* Right: Score Block */}
      <div className="min-w-0 sm:min-w-[200px] w-full sm:w-auto text-left sm:text-right">
        <div className="text-xs text-gray-400 mb-1.5 font-medium flex flex-wrap sm:block gap-x-2">
          <span>Lane A: {formatTimeMMSSmmm(score.lane_a_time)}</span>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <span>Lane B: {formatTimeMMSSmmm(score.lane_b_time)}</span>
        </div>
        <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums ${
          isInvalid ? 'text-gray-500 line-through' : 'text-green-400'
        }`}>
          {isInvalid ? 'INVALID' : formatTimeMMSSmmm(score.total_time)}
        </div>
        {(score.lane_a_status !== 'VALID' || score.lane_b_status !== 'VALID') && (
          <div className="text-xs text-red-400 mt-1.5 font-medium">
            {score.lane_a_status !== 'VALID' && `A: ${score.lane_a_status} `}
            {score.lane_b_status !== 'VALID' && `B: ${score.lane_b_status}`}
          </div>
        )}
      </div>
    </div>
  )
}

export default QualificationCard
