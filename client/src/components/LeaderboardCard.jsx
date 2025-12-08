import React from 'react'

/**
 * LeaderboardCard Component - New Design Style
 * 
 * Layout based on reference image:
 * - Large rank box (yellow-gold)
 * - Name and team/status
 * - 2x4 grid of attempt numbers (zone attempts top row, top attempts bottom row)
 * - Total points (large green)
 */
function LeaderboardCard({ climber, index }) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-rich-black border-b border-white/10 last:border-b-0 hover:bg-gunmetal/30 transition-all duration-200 w-full">
      {/* Left: Rank Box with Label */}
      <div className="relative flex-shrink-0">
        {/* Small Rank Label Box - Above Right */}
        <div className="absolute -top-1 -right-1 bg-gray-700/90 rounded px-1.5 sm:px-2 py-0.5 z-10 border border-gray-600">
          <span className="text-[9px] sm:text-[10px] font-bold text-white">#{climber.rank}</span>
        </div>
        {/* Large Rank Box - Yellow Gold */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-3xl sm:text-4xl font-black text-gray-900">{climber.rank}</span>
        </div>
      </div>

      {/* Center: Name and Score Grid */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        {/* Name and Team */}
        <div className="mb-3 sm:mb-4">
          <div className="text-xl sm:text-2xl font-bold text-white mb-1 uppercase tracking-tight truncate">
            {climber.name}
          </div>
          <div className="text-xs sm:text-sm text-white/80 font-medium">
            {climber.team || 'SOLO'}
          </div>
        </div>

        {/* Score Grid - 2 rows x 4 columns */}
        <div className="space-y-1.5">
          {/* Grid Container */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {climber.scores.map((score, idx) => {
              const zoneAttempt = score.zoneAttempts || 0
              const topAttempt = score.topAttempts || 0
              
              return (
                <div key={idx} className="flex flex-col gap-1">
                  {/* Row 1: Zone Attempt */}
                  <div className={`w-full h-9 sm:h-11 rounded-md flex items-center justify-center font-bold text-xs sm:text-sm ${
                    zoneAttempt > 0
                      ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-gray-900 shadow-md'
                      : 'bg-gray-800 border border-gray-700 text-white/60'
                  }`}>
                    {zoneAttempt > 0 ? zoneAttempt : '-'}
                  </div>
                  {/* Row 2: Top Attempt */}
                  <div className={`w-full h-9 sm:h-11 rounded-md flex items-center justify-center font-bold text-xs sm:text-sm ${
                    topAttempt > 0
                      ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-gray-900 shadow-md'
                      : 'bg-gray-800 border border-gray-700 text-white/60'
                  }`}>
                    {topAttempt > 0 ? topAttempt : '-'}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Boulder Number Labels */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {climber.scores.map((_, idx) => (
              <div key={idx} className="text-center">
                <span className="text-[10px] sm:text-xs text-gray-500 font-semibold">{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Total Points */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto flex-shrink-0 sm:min-w-[120px] lg:min-w-[140px] mt-2 sm:mt-0">
        <div className="text-3xl sm:text-4xl font-black text-green-400 tabular-nums mb-0 sm:mb-1" style={{
          textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
        }}>
          {climber.totalScore.toFixed(1)}
        </div>
        <div className="text-[10px] sm:text-xs text-white/60 font-medium uppercase tracking-wider">
          Total Points
        </div>
      </div>
    </div>
  )
}

export default LeaderboardCard
