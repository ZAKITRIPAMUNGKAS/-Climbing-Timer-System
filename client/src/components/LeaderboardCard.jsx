import React from 'react'

/**
 * LeaderboardCard Component - Clean Enterprise White Design
 * 
 * Layout:
 * - Left: Rank & Info (Rank, Bib, Name, Team)
 * - Center: 4 Grid Boxes (one for each boulder)
 *   - Each column has 2 small square boxes stacked vertically
 *   - Top Box: Displays topAttempts. Background is BLACK if isTop is true, otherwise White/Empty
 *   - Bottom Box: Displays zoneAttempts. Background is BLACK if isZone is true, otherwise White/Empty
 * - Right: Total Score (Green text)
 */
function LeaderboardCard({ climber, index }) {
  return (
    <div className="flex items-center gap-6 p-6 bg-rich-black rounded-xl shadow-2xl border border-white/10 hover:border-goldenrod/30 transition-all duration-200">
      {/* Left: Rank & Info */}
      <div className="flex items-center gap-4 min-w-[200px]">
        {/* Rank Badge */}
        <div className="flex items-center justify-center w-14 h-14 rounded-lg font-bold text-2xl bg-gunmetal border border-white/10 text-goldenrod">
          {climber.rank}
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-gunmetal border border-white/10 rounded text-xs font-semibold text-gray-300 tracking-wide">
              #{climber.bib_number}
            </span>
          </div>
          <div className="font-bold text-lg text-white mb-0.5 tracking-tight">
            {climber.name}
          </div>
          {climber.team && (
            <div className="text-sm text-gray-400">
              {climber.team}
            </div>
          )}
        </div>
      </div>

      {/* Center: 4 Grid Boxes */}
      <div className="flex gap-3 flex-1 justify-center">
        {climber.scores.map((score, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 items-center">
            {/* Top Box */}
            <div
              className={`w-14 h-14 rounded-sm border-2 flex items-center justify-center font-bold text-base transition-all duration-200 tabular-nums ${
                score.isTop
                  ? 'bg-goldenrod border-goldenrod text-black'
                  : 'bg-gunmetal border-white/10 text-gray-500'
              }`}
            >
              {score.topAttempts > 0 ? score.topAttempts : '-'}
            </div>
            
            {/* Bottom Box */}
            <div
              className={`w-14 h-14 rounded-sm border-2 flex items-center justify-center font-bold text-base transition-all duration-200 tabular-nums ${
                score.isZone
                  ? 'bg-goldenrod border-goldenrod text-black'
                  : 'bg-gunmetal border-white/10 text-gray-500'
              }`}
            >
              {score.zoneAttempts > 0 ? score.zoneAttempts : '-'}
            </div>
            
            {/* Boulder Number Label */}
            <div className="text-center text-xs text-gray-400 mt-0.5 font-medium">
              {idx + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Right: Total Score */}
      <div className="min-w-[120px] text-right">
        <div className="text-3xl font-bold text-green-400 tabular-nums">
          {climber.totalScore.toFixed(1)}
        </div>
        <div className="text-xs text-gray-400 mt-1 font-medium">Total Points</div>
      </div>
    </div>
  )
}

export default LeaderboardCard
