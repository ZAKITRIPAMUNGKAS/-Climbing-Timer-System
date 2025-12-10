import React from 'react'

/**
 * LeaderboardCard Component - Modern Card Style Design
 * 
 * Modern, clean design with:
 * - Clean white card with refined shadow
 * - Large rank number as watermark
 * - Modern score grid with vibrant gradients
 * - Rounded pills for score boxes
 * - Large monospace total score
 */
function LeaderboardCard({ climber, index }) {
  // Ensure rank is displayed correctly
  const displayRank = climber.rank || index + 1
  
  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8 p-6 bg-[#121212] border border-zinc-800 rounded-sm shadow-lg hover:border-[#FFB800]/30 transition-all duration-200 w-full overflow-hidden">
      
      {/* Left: Rank Badge */}
      <div className="flex-shrink-0 w-16 sm:w-20 flex items-center justify-center">
        <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-100 tabular-nums">
          {displayRank}
        </div>
      </div>

      {/* Left: Athlete Info */}
      <div className="relative z-10 flex-1 min-w-0 w-full sm:w-auto">
        {/* Name */}
        <div className="mb-3 sm:mb-4 text-center sm:text-left">
          <div className="text-xl sm:text-2xl font-bold text-zinc-100 mb-1 truncate">
            {climber.name}
          </div>
          <div className="text-sm text-zinc-500">
            {climber.team || 'SOLO'}
          </div>
        </div>

        {/* Score Grid - Centered */}
        <div className="space-y-2 flex flex-col items-center sm:items-start">
          {/* Grid Container */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mx-auto sm:mx-0">
            {climber.scores.map((score, idx) => {
              // Display attempts as stored in database
              // - topAttempts: number of attempts to reach TOP (0 if not reached)
              // - zoneAttempts: number of attempts to reach ZONE (0 if not reached)
              // Note: When TOP is reached, zoneAttempts is also set (zone auto-reached)
              const zoneAttempt = score.zoneAttempts || 0
              const topAttempt = score.topAttempts || 0
              
              return (
                <div key={idx} className="flex flex-col gap-1.5 w-14 sm:w-16">
                  {/* Zone Attempt - Yellow/Orange Gradient */}
                  <div className={`w-full h-16 sm:h-20 rounded-md flex items-center justify-center font-bold text-base sm:text-lg ${
                    zoneAttempt > 0
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                  }`}>
                    {zoneAttempt > 0 ? zoneAttempt : '-'}
                  </div>
                  {/* Top Attempt - Green Gradient */}
                  <div className={`w-full h-16 sm:h-20 rounded-md flex items-center justify-center font-bold text-base sm:text-lg ${
                    topAttempt > 0
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                  }`}>
                    {topAttempt > 0 ? topAttempt : '-'}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Boulder Number Labels */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mx-auto sm:mx-0">
            {climber.scores.map((_, idx) => (
              <div key={idx} className="text-center w-14 sm:w-16">
                <span className="text-xs text-zinc-500 font-semibold">{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Total Score - Large Monospace */}
      <div className="relative z-10 flex flex-row sm:flex-col items-center sm:items-end justify-center sm:justify-end w-full sm:w-auto flex-shrink-0 sm:min-w-[120px] lg:min-w-[140px] mt-2 sm:mt-0">
        <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-100 tabular-nums font-mono">
          {climber.totalScore.toFixed(1)}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardCard
