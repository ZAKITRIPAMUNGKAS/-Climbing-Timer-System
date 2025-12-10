import React from 'react'
import { X } from 'lucide-react'

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

function MatchDetailModal({ isOpen, onClose, match }) {
  if (!isOpen || !match) return null

  // Get times - use new two-run structure if available
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gunmetal rounded-xl shadow-xl max-w-2xl w-full p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Match Details</h3>
            <p className="text-sm text-gray-400 mt-1">
              {match.stage} - Match {match.match_order}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Climber A Section */}
          <div className={`bg-rich-black rounded-lg p-4 border-2 ${isAWinner ? 'border-green-500/50' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className={`text-lg font-bold ${isAWinner ? 'text-green-400' : 'text-white'}`}>
                  {match.climber_a_name}
                  {isAWinner && <span className="ml-2 text-sm">🏆 Winner</span>}
                </h4>
                <p className="text-sm text-gray-400">
                  #{match.climber_a_bib} {match.climber_a_team ? `• ${match.climber_a_team}` : ''}
                  {match.climber_a_rank && <span className="ml-2 text-goldenrod">(Rank #{match.climber_a_rank})</span>}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Run 1 (Lane A)</p>
                <p className="text-lg font-mono font-semibold text-white">
                  {aRun1 !== null ? formatTimeMMSSmmm(aRun1) : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {match.climber_a_run1_status || 'VALID'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Run 2 (Lane B)</p>
                <p className="text-lg font-mono font-semibold text-white">
                  {aRun2 !== null ? formatTimeMMSSmmm(aRun2) : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {match.climber_a_run2_status || 'VALID'}
                </p>
              </div>
            </div>
            
            {(aTotal !== null && aTotal > 0) || (aRun1 !== null && aRun2 !== null) ? (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-1">Total Time</p>
                <p className={`text-2xl font-mono font-bold ${isAWinner ? 'text-green-400' : 'text-goldenrod'}`}>
                  {formatTimeMMSSmmm(aTotal && aTotal > 0 ? aTotal : (aRun1 + aRun2))}
                </p>
              </div>
            ) : null}
          </div>

          {/* VS Divider */}
          <div className="text-center text-gray-500 font-bold text-xl">VS</div>

          {/* Climber B Section */}
          <div className={`bg-rich-black rounded-lg p-4 border-2 ${isBWinner ? 'border-green-500/50' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className={`text-lg font-bold ${isBWinner ? 'text-green-400' : 'text-white'}`}>
                  {match.climber_b_name || 'BYE'}
                  {isBWinner && <span className="ml-2 text-sm">🏆 Winner</span>}
                </h4>
                <p className="text-sm text-gray-400">
                  {match.climber_b_bib ? `#${match.climber_b_bib}` : ''} {match.climber_b_team ? `• ${match.climber_b_team}` : ''}
                  {match.climber_b_rank && <span className="ml-2 text-goldenrod">(Rank #{match.climber_b_rank})</span>}
                </p>
              </div>
            </div>
            
            {match.climber_b_id ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Run 1 (Lane B)</p>
                    <p className="text-lg font-mono font-semibold text-white">
                      {bRun1 !== null ? formatTimeMMSSmmm(bRun1) : '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {match.climber_b_run1_status || 'VALID'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Run 2 (Lane A)</p>
                    <p className="text-lg font-mono font-semibold text-white">
                      {bRun2 !== null ? formatTimeMMSSmmm(bRun2) : '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {match.climber_b_run2_status || 'VALID'}
                    </p>
                  </div>
                </div>
                
                {(bTotal !== null && bTotal > 0) || (bRun1 !== null && bRun2 !== null) ? (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Total Time</p>
                    <p className={`text-2xl font-mono font-bold ${isBWinner ? 'text-green-400' : 'text-goldenrod'}`}>
                      {formatTimeMMSSmmm(bTotal && bTotal > 0 ? bTotal : (bRun1 + bRun2))}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="text-center py-4 text-yellow-400 font-semibold">
                BYE (Walkover)
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-goldenrod text-rich-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default MatchDetailModal

