import React from 'react'

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
    <div className={`flex items-center gap-6 p-6 bg-rich-black rounded-xl shadow-2xl border border-white/10 hover:border-goldenrod/30 transition-all duration-200 ${
      isInvalid ? 'opacity-75' : ''
    }`}>
      {/* Left: Rank Number */}
      <div className="flex items-center justify-center min-w-[80px]">
        {score.rank ? (
          <div className="text-4xl font-bold text-goldenrod tabular-nums">
            {score.rank}
          </div>
        ) : (
          <div className="text-2xl font-bold text-gray-500">
            -
          </div>
        )}
      </div>

      {/* Center: Climber Info */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 bg-gunmetal border border-white/10 rounded text-xs font-semibold text-gray-300 tracking-wide">
            #{score.bib_number}
          </span>
        </div>
        <div className="font-bold text-lg text-white mb-0.5 tracking-tight">
          {score.name}
        </div>
        {score.team && (
          <div className="text-sm text-gray-400">
            {score.team}
          </div>
        )}
      </div>

      {/* Right: Score Block */}
      <div className="min-w-[200px] text-right">
        <div className="text-xs text-gray-400 mb-1.5 font-medium space-x-2">
          <span>Lane A: {score.lane_a_time !== null ? score.lane_a_time.toFixed(2) : '-'}</span>
          <span className="text-gray-600">|</span>
          <span>Lane B: {score.lane_b_time !== null ? score.lane_b_time.toFixed(2) : '-'}</span>
        </div>
        <div className={`text-4xl font-bold tabular-nums ${
          isInvalid ? 'text-gray-500 line-through' : 'text-green-400'
        }`}>
          {isInvalid ? 'INVALID' : score.total_time.toFixed(2)}
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
