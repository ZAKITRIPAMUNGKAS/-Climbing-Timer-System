import { useState, useEffect } from 'react'
import { X, Save, Lock, Unlock } from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '../hooks/useAuth'
import { formatTimeMMSSmmm, parseTimeMMSSmmm } from '../utils/timeFormat'

function FinalsMatchInputModal({ isOpen, onClose, match, competition, onSuccess }) {
  const { isAdmin } = useAuth()
  const [matchScore, setMatchScore] = useState({
    // Climber A runs
    climber_a_run1_time: '',
    climber_a_run2_time: '',
    climber_a_run1_status: 'VALID',
    climber_a_run2_status: 'VALID',
    // Climber B runs
    climber_b_run1_time: '',
    climber_b_run2_time: '',
    climber_b_run1_status: 'VALID',
    climber_b_run2_status: 'VALID'
  })
  const [loading, setLoading] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    if (isOpen && match) {
      setMatchScore({
        // Climber A runs
        climber_a_run1_time: match.climber_a_run1_time ? formatTimeMMSSmmm(match.climber_a_run1_time) : '',
        climber_a_run2_time: match.climber_a_run2_time ? formatTimeMMSSmmm(match.climber_a_run2_time) : '',
        climber_a_run1_status: match.climber_a_run1_status || 'VALID',
        climber_a_run2_status: match.climber_a_run2_status || 'VALID',
        // Climber B runs
        climber_b_run1_time: match.climber_b_run1_time ? formatTimeMMSSmmm(match.climber_b_run1_time) : '',
        climber_b_run2_time: match.climber_b_run2_time ? formatTimeMMSSmmm(match.climber_b_run2_time) : '',
        climber_b_run1_status: match.climber_b_run1_status || 'VALID',
        climber_b_run2_status: match.climber_b_run2_status || 'VALID'
      })
    }
  }, [isOpen, match])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if match is finalized/locked
    if (match.is_finalized) {
      await Swal.fire({
        icon: 'warning',
        title: 'Match is Finalized',
        text: 'This match is locked. Please unlock it first to make changes.',
        confirmButtonText: 'OK'
      })
      return
    }

    try {
      setLoading(true)
      // Convert MM:SS.mmm format to seconds before sending
      const aRun1Seconds = matchScore.climber_a_run1_time ? parseTimeMMSSmmm(matchScore.climber_a_run1_time) : null
      const aRun2Seconds = matchScore.climber_a_run2_time ? parseTimeMMSSmmm(matchScore.climber_a_run2_time) : null
      const bRun1Seconds = matchScore.climber_b_run1_time ? parseTimeMMSSmmm(matchScore.climber_b_run1_time) : null
      const bRun2Seconds = matchScore.climber_b_run2_time ? parseTimeMMSSmmm(matchScore.climber_b_run2_time) : null
      
      const response = await fetch(
        `/api/speed-competitions/${competition.id}/finals/${match.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            climber_a_run1_time: aRun1Seconds,
            climber_a_run2_time: aRun2Seconds,
            climber_a_run1_status: matchScore.climber_a_run1_status,
            climber_a_run2_status: matchScore.climber_a_run2_status,
            climber_b_run1_time: bRun1Seconds,
            climber_b_run2_time: bRun2Seconds,
            climber_b_run1_status: matchScore.climber_b_run1_status,
            climber_b_run2_status: matchScore.climber_b_run2_status
          })
        }
      )

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Score Saved',
          timer: 1500,
          showConfirmButton: false
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'Failed to update match score'
        })
      }
    } catch (error) {
      console.error('Error updating match score:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update match score'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockMatch = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Unlock Match',
      html: `
        <p class="text-left mb-4">Please provide a reason for unlocking this match:</p>
        <textarea 
          id="reason" 
          class="swal2-textarea" 
          placeholder="Enter reason (minimum 10 characters)..."
          rows="3"
        ></textarea>
      `,
      input: 'textarea',
      inputPlaceholder: 'Enter reason for unlocking...',
      showCancelButton: true,
      confirmButtonText: 'Unlock',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Reason must be at least 10 characters'
        }
      },
      preConfirm: () => {
        const reasonInput = document.getElementById('reason')
        return reasonInput ? reasonInput.value : ''
      }
    })

    if (!reason) return

    try {
      setUnlocking(true)
      const response = await fetch('/api/scores/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason,
          entity_type: 'speed_final',
          entity_id: match.id
        })
      })

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Match Unlocked',
          text: 'You can now edit this match.',
          timer: 2000,
          showConfirmButton: false
        })
        if (onSuccess) onSuccess()
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Unlock Failed',
          text: error.error || 'Failed to unlock match'
        })
      }
    } catch (error) {
      console.error('Error unlocking match:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to unlock match'
      })
    } finally {
      setUnlocking(false)
    }
  }

  if (!isOpen || !match || !competition) return null

  const isBYE = !match.climber_b_id

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Input Match Score</h3>
            <p className="text-sm text-gray-600">
              {match.stage} - Match {match.match_order}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Locked Status */}
        {match.is_finalized && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="text-red-600" size={20} />
              <span className="text-red-700 font-semibold">Match is Locked</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleUnlockMatch}
                disabled={unlocking}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Unlock size={14} />
                Unlock
              </button>
            )}
          </div>
        )}

        {/* BYE Match */}
        {isBYE ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-lg font-semibold text-yellow-800 mb-2">BYE (Walkover)</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {match.climber_a_name} (#{match.climber_a_bib})
            </div>
            <div className="text-sm text-gray-600">
              This climber automatically advances to the next round.
            </div>
            {match.winner_id && (
              <div className="mt-4 text-green-600 font-semibold">
                ✓ Winner: {match.climber_a_name}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Lane A</div>
                  <div className="font-semibold text-gray-900">
                    {match.climber_a_name} (#{match.climber_a_bib})
                  </div>
                  {match.climber_a_team && (
                    <div className="text-sm text-gray-500">{match.climber_a_team}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Lane B</div>
                  <div className="font-semibold text-gray-900">
                    {match.climber_b_name} (#{match.climber_b_bib})
                  </div>
                  {match.climber_b_team && (
                    <div className="text-sm text-gray-500">{match.climber_b_team}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Inputs - Speed Classic: Two runs per climber */}
            <div className="space-y-6">
              {/* Climber A Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">
                  {match.climber_a_name} (#{match.climber_a_bib}) - Lane A
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Run 1 (Lane A) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Run 1 - Lane A (MM:SS.mmm)
                    </label>
                    <input
                      type="text"
                      value={matchScore.climber_a_run1_time}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_a_run1_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                      placeholder="00:06.500"
                      disabled={match.is_finalized}
                      pattern="\d{1,2}:\d{2}\.\d{1,3}"
                    />
                    <select
                      value={matchScore.climber_a_run1_status}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_a_run1_status: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={match.is_finalized}
                    >
                      <option value="VALID">VALID</option>
                      <option value="FALL">FALL</option>
                      <option value="FALSE_START">FALSE_START</option>
                      <option value="DNS">DNS</option>
                    </select>
                  </div>
                  {/* Run 2 (Lane B) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Run 2 - Lane B (MM:SS.mmm)
                    </label>
                    <input
                      type="text"
                      value={matchScore.climber_a_run2_time}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_a_run2_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                      placeholder="00:06.300"
                      disabled={match.is_finalized}
                      pattern="\d{1,2}:\d{2}\.\d{1,3}"
                    />
                    <select
                      value={matchScore.climber_a_run2_status}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_a_run2_status: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={match.is_finalized}
                    >
                      <option value="VALID">VALID</option>
                      <option value="FALL">FALL</option>
                      <option value="FALSE_START">FALSE_START</option>
                      <option value="DNS">DNS</option>
                    </select>
                  </div>
                </div>
                {/* Calculate and display total time */}
                {(() => {
                  const run1Seconds = matchScore.climber_a_run1_time ? parseTimeMMSSmmm(matchScore.climber_a_run1_time) : null
                  const run2Seconds = matchScore.climber_a_run2_time ? parseTimeMMSSmmm(matchScore.climber_a_run2_time) : null
                  
                  // Calculate total: use database value if available, otherwise calculate from runs
                  let totalTime = null
                  if (match.climber_a_total_time !== null && match.climber_a_total_time !== undefined) {
                    totalTime = match.climber_a_total_time
                  } else if (run1Seconds !== null && run2Seconds !== null && 
                             matchScore.climber_a_run1_status === 'VALID' && 
                             matchScore.climber_a_run2_status === 'VALID') {
                    // Calculate total from run1 + run2
                    totalTime = run1Seconds + run2Seconds
                  }
                  
                  if (totalTime !== null && totalTime > 0) {
                    return (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-semibold">Total: </span>
                        {formatTimeMMSSmmm(totalTime)}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              {/* Climber B Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">
                  {match.climber_b_name} (#{match.climber_b_bib}) - Lane B
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Run 1 (Lane B) - Speed Classic: Climber B Run 1 is in Lane B */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Run 1 - Lane B (MM:SS.mmm)
                    </label>
                    <input
                      type="text"
                      value={matchScore.climber_b_run1_time}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_b_run1_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                      placeholder="00:06.500"
                      disabled={match.is_finalized}
                      pattern="\d{1,2}:\d{2}\.\d{1,3}"
                    />
                    <select
                      value={matchScore.climber_b_run1_status}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_b_run1_status: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={match.is_finalized}
                    >
                      <option value="VALID">VALID</option>
                      <option value="FALL">FALL</option>
                      <option value="FALSE_START">FALSE_START</option>
                      <option value="DNS">DNS</option>
                    </select>
                  </div>
                  {/* Run 2 (Lane A) - Speed Classic: Climber B Run 2 is in Lane A */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Run 2 - Lane A (MM:SS.mmm)
                    </label>
                    <input
                      type="text"
                      value={matchScore.climber_b_run2_time}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_b_run2_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                      placeholder="00:06.300"
                      disabled={match.is_finalized}
                      pattern="\d{1,2}:\d{2}\.\d{1,3}"
                    />
                    <select
                      value={matchScore.climber_b_run2_status}
                      onChange={(e) => setMatchScore({ ...matchScore, climber_b_run2_status: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={match.is_finalized}
                    >
                      <option value="VALID">VALID</option>
                      <option value="FALL">FALL</option>
                      <option value="FALSE_START">FALSE_START</option>
                      <option value="DNS">DNS</option>
                    </select>
                  </div>
                </div>
                {/* Calculate and display total time */}
                {(() => {
                  const run1Seconds = matchScore.climber_b_run1_time ? parseTimeMMSSmmm(matchScore.climber_b_run1_time) : null
                  const run2Seconds = matchScore.climber_b_run2_time ? parseTimeMMSSmmm(matchScore.climber_b_run2_time) : null
                  
                  // Calculate total: use database value if available, otherwise calculate from runs
                  let totalTime = null
                  if (match.climber_b_total_time !== null && match.climber_b_total_time !== undefined) {
                    totalTime = match.climber_b_total_time
                  } else if (run1Seconds !== null && run2Seconds !== null && 
                             matchScore.climber_b_run1_status === 'VALID' && 
                             matchScore.climber_b_run2_status === 'VALID') {
                    // Calculate total from run1 + run2
                    totalTime = run1Seconds + run2Seconds
                  }
                  
                  if (totalTime !== null && totalTime > 0) {
                    return (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-semibold">Total: </span>
                        {formatTimeMMSSmmm(totalTime)}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Winner Display */}
            {match.winner_id && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Winner</div>
                <div className="text-lg font-bold text-green-700">
                  {match.winner_id === match.climber_a_id ? match.climber_a_name : match.climber_b_name}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || match.is_finalized}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Saving...' : match.is_finalized ? 'Match Locked' : 'Save Score'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default FinalsMatchInputModal

