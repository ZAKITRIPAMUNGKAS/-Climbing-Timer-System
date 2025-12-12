import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Save, Mountain, Lock, Unlock, ChevronLeft, ChevronRight } from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '../hooks/useAuth'
import { formatTimeMMSSmmm, parseTimeMMSSmmm } from '../utils/timeFormat'
import { queueBoulderScoreUpdate } from '../utils/requestQueue'

function ScoreInputModal({ isOpen, onClose, climber, competition, onSuccess, boulderRoute, allClimbers = [], climberScores = {}, onNavigateClimber }) {
  const { isAdmin } = useAuth()
  const [boulderScores, setBoulderScores] = useState({})
  const [speedScore, setSpeedScore] = useState({
    lane_a_time: '',
    lane_b_time: '',
    lane_a_status: 'VALID',
    lane_b_status: 'VALID',
    is_finalized: false
  })
  const [loading, setLoading] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const debounceTimerRef = useRef(null)

  useEffect(() => {
    if (isOpen && climber && competition) {
      if (competition.type === 'boulder') {
        fetchBoulderScores()
      } else {
        fetchSpeedScore()
      }
    }
  }, [isOpen, climber?.id, competition?.id, boulderRoute]) // Use climber.id and competition.id to ensure re-fetch when climber changes

  const fetchBoulderScores = async () => {
    try {
      // If boulderRoute is specified, only fetch that route
      if (boulderRoute) {
        const scoreRes = await fetch(
          `/api/competitions/${competition.id}/climbers/${climber.id}/boulders/${boulderRoute}`
        )
        if (scoreRes.ok) {
          const score = await scoreRes.json()
          // Normalize MySQL boolean values (0/1) to JavaScript booleans
          const normalizedScore = score ? {
            ...score,
            is_finalized: score.is_finalized === 1 || score.is_finalized === true,
            is_locked: score.is_locked === 1 || score.is_locked === true,
            reached_zone: score.reached_zone === 1 || score.reached_zone === true,
            reached_top: score.reached_top === 1 || score.reached_top === true,
            is_disqualified: score.is_disqualified === 1 || score.is_disqualified === true
          } : {
            attempts: 0,
            reached_zone: false,
            reached_top: false,
            zone_attempt: null,
            top_attempt: null,
            is_finalized: false,
            is_disqualified: false
          }
          setBoulderScores({ [boulderRoute]: normalizedScore })
        } else if (scoreRes.status === 429) {
          console.warn('Rate limited when fetching boulder score, will retry')
          // Don't show error, just log - rate limit should be temporary
        }
      } else {
        // Fetch all routes using batch endpoint (optimized - single request instead of multiple)
        const totalBoulders = competition.total_boulders || 4
        const boulderNumbers = Array.from({ length: totalBoulders }, (_, i) => i + 1).join(',')
        const response = await fetch(
          `/api/competitions/${competition.id}/boulders/batch?climberIds=${climber.id}&boulderNumbers=${boulderNumbers}`
        )
        if (response.ok) {
          const scoreMap = await response.json()
          const scores = {}
          for (let i = 1; i <= totalBoulders; i++) {
            const key = `${climber.id}_${i}`
            const rawScore = scoreMap[key]
            // Normalize MySQL boolean values (0/1) to JavaScript booleans
            scores[i] = rawScore ? {
              ...rawScore,
              is_finalized: rawScore.is_finalized === 1 || rawScore.is_finalized === true,
              is_locked: rawScore.is_locked === 1 || rawScore.is_locked === true,
              reached_zone: rawScore.reached_zone === 1 || rawScore.reached_zone === true,
              reached_top: rawScore.reached_top === 1 || rawScore.reached_top === true,
              is_disqualified: rawScore.is_disqualified === 1 || rawScore.is_disqualified === true
            } : {
              id: null,
              competition_id: competition.id,
              climber_id: climber.id,
              boulder_number: i,
              attempts: 0,
              reached_zone: false,
              reached_top: false,
              zone_attempt: null,
              top_attempt: null,
              is_finalized: false,
              is_disqualified: false,
              is_locked: false
            }
          }
          setBoulderScores(scores)
        } else if (response.status === 429) {
          console.warn('Rate limited when fetching batch scores, will retry')
          // Don't show error, just log - rate limit should be temporary
          // Could implement retry logic here if needed
        } else {
          // Fallback to individual requests if batch endpoint fails
          const scores = {}
          for (let i = 1; i <= totalBoulders; i++) {
            const scoreRes = await fetch(
              `/api/competitions/${competition.id}/climbers/${climber.id}/boulders/${i}`
            )
            if (scoreRes.ok) {
              const score = await scoreRes.json()
              scores[i] = score || {
                attempts: 0,
                reached_zone: false,
                reached_top: false,
                zone_attempt: null,
                top_attempt: null,
                is_finalized: false,
                is_disqualified: false
              }
            } else if (scoreRes.status === 429) {
              console.warn(`Rate limited when fetching boulder ${i} score`)
              // Use default score for this boulder
              scores[i] = {
                attempts: 0,
                reached_zone: false,
                reached_top: false,
                zone_attempt: null,
                top_attempt: null,
                is_finalized: false,
                is_disqualified: false
              }
            }
          }
          setBoulderScores(scores)
        }
      }
    } catch (error) {
      console.error('Error fetching boulder scores:', error)
    }
  }

  const fetchSpeedScore = async () => {
    try {
      // Fetch qualification score if exists
      const response = await fetch(
        `/api/speed-competitions/${competition.id}/qualification`
      )
      if (response.ok) {
        const leaderboard = await response.json()
        const climberScore = leaderboard.find(s => s.climber_id === climber.id)
        if (climberScore) {
          setSpeedScore({
            lane_a_time: climberScore.lane_a_time ? formatTimeMMSSmmm(climberScore.lane_a_time) : '',
            lane_b_time: climberScore.lane_b_time ? formatTimeMMSSmmm(climberScore.lane_b_time) : '',
            lane_a_status: climberScore.lane_a_status || 'VALID',
            lane_b_status: climberScore.lane_b_status || 'VALID',
            is_finalized: climberScore.is_finalized || false
          })
        }
      }
    } catch (error) {
      console.error('Error fetching speed score:', error)
    }
  }

  // Unlock score function
  const handleUnlockScore = async (entityType, entityId) => {
    const { value: reason } = await Swal.fire({
      title: 'Unlock Score',
      html: `
        <p class="text-left mb-4">Please provide a reason for unlocking this score:</p>
        <textarea 
          id="reason" 
          class="swal2-textarea" 
          placeholder="Enter reason (minimum 10 characters)..."
          rows="3"
        ></textarea>
      `,
      input: 'textarea',
      inputPlaceholder: 'Enter reason for unlocking...',
      inputAttributes: {
        id: 'reason',
        rows: 3
      },
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
          entity_type: entityType,
          entity_id: entityId
        })
      })

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Score Unlocked',
          text: 'You can now edit this score.',
          timer: 2000,
          showConfirmButton: false
        })
        
        // Refresh scores
        if (competition.type === 'boulder') {
          await fetchBoulderScores()
        } else {
          await fetchSpeedScore()
        }
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Unlock Failed',
          text: error.error || 'Failed to unlock score'
        })
      }
    } catch (error) {
      console.error('Error unlocking score:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to unlock score'
      })
    } finally {
      setUnlocking(false)
    }
  }

  // Debounced attempt handler to prevent rapid clicks
  const handleBoulderActionDebounced = useCallback((boulderNumber, action) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // For attempt action, debounce to prevent spam
    if (action === 'attempt') {
      debounceTimerRef.current = setTimeout(() => {
        handleBoulderAction(boulderNumber, action)
      }, 150) // 150ms debounce for attempt button
    } else {
      // For other actions, execute immediately
      handleBoulderAction(boulderNumber, action)
    }
  }, []) // handleBoulderAction is stable function, no need to include in deps

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleBoulderAction = async (boulderNumber, action) => {
    // Fat Finger Protection: Show confirmation for critical actions
    if (action === 'top' || action === 'finalize' || action === 'disqualify') {
      const result = await Swal.fire({
        title: action === 'top' ? 'Mark as Top?' : action === 'disqualify' ? 'Diskualifikasi Peserta?' : 'Finalize Score?',
        text: action === 'top' 
          ? 'This will automatically finalize the score. Are you sure?'
          : action === 'disqualify'
          ? 'Peserta akan ditandai sebagai N/A (tidak hadir/diskualifikasi). Apakah Anda yakin?'
          : 'This will lock the score. Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: action === 'top' ? 'Yes, Mark as Top' : action === 'disqualify' ? 'Ya, Diskualifikasi' : 'Yes, Finalize',
        confirmButtonColor: action === 'disqualify' ? '#ef4444' : '#10b981', // Red for disqualify, Green for others
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#6b7280', // Gray
        reverseButtons: true
      })

      if (!result.isConfirmed) {
        return
      }
    }

    try {
      setLoading(true)
      
      // Queue request untuk prevent data race conditions
      const response = await queueBoulderScoreUpdate(
        competition.id,
        climber.id,
        boulderNumber,
        () => fetch(
          `/api/competitions/${competition.id}/climbers/${climber.id}/boulders/${boulderNumber}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action })
          }
        )
      )

      if (response.ok) {
        // Optimistic update: Use response data directly instead of fetching again
        const updatedScore = await response.json()
        
        // Update local state immediately for instant UI feedback
        if (boulderRoute) {
          const normalizedScore = {
            ...updatedScore,
            is_finalized: updatedScore.is_finalized === 1 || updatedScore.is_finalized === true,
            is_locked: updatedScore.is_locked === 1 || updatedScore.is_locked === true,
            reached_zone: updatedScore.reached_zone === 1 || updatedScore.reached_zone === true,
            reached_top: updatedScore.reached_top === 1 || updatedScore.reached_top === true,
            is_disqualified: updatedScore.is_disqualified === 1 || updatedScore.is_disqualified === true
          }
          setBoulderScores({ [boulderRoute]: normalizedScore })
        } else {
          // Update all routes if not in route mode
          setBoulderScores(prev => ({
            ...prev,
            [boulderNumber]: {
              ...updatedScore,
              is_finalized: updatedScore.is_finalized === 1 || updatedScore.is_finalized === true,
              is_locked: updatedScore.is_locked === 1 || updatedScore.is_locked === true,
              reached_zone: updatedScore.reached_zone === 1 || updatedScore.reached_zone === true,
              reached_top: updatedScore.reached_top === 1 || updatedScore.reached_top === true,
              is_disqualified: updatedScore.is_disqualified === 1 || updatedScore.is_disqualified === true
            }
          }))
        }
        
        // Show success message for critical actions (non-blocking)
        if (action === 'top' || action === 'finalize' || action === 'disqualify') {
          Swal.fire({
            icon: 'success',
            title: action === 'top' ? 'Top Recorded' : action === 'disqualify' ? 'Peserta Didiskualifikasi' : 'Score Finalized',
            text: action === 'top' 
              ? 'Score has been marked as Top and finalized.'
              : action === 'disqualify'
              ? 'Peserta telah ditandai sebagai N/A (diskualifikasi).'
              : 'Score has been finalized and locked.',
            timer: 1500,
            showConfirmButton: false
          })
        }
        
        // Auto-advance to next climber if action is 'finalize' or 'top' (top auto-finalizes) and in route-based mode
        // NO NEED to refetch - server emits socket.io event and optimistic update already applied
        if (boulderRoute && onSuccess && (action === 'finalize' || action === 'top')) {
          // Immediate advance without delay for better UX
          onSuccess(action === 'top' ? 'finalize' : action)
        } else if (onSuccess && action !== 'finalize' && action !== 'top') {
          // For other actions, just notify but don't advance
          onSuccess(null)
        }
      } else if (response.status === 429) {
        // Handle rate limit error gracefully
        await Swal.fire({
          icon: 'warning',
          title: 'Terlalu Banyak Request',
          text: 'Server sedang sibuk. Silakan tunggu sebentar dan coba lagi.',
          timer: 3000
        })
      } else {
        // Try to parse error, but handle cases where it's not JSON
        let errorMessage = 'Failed to update score'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage
        })
      }
    } catch (error) {
      console.error('Error updating boulder score:', error)
      // Handle SyntaxError for non-JSON responses (like rate limit messages)
      if (error instanceof SyntaxError) {
        await Swal.fire({
          icon: 'warning',
          title: 'Terlalu Banyak Request',
          text: 'Server sedang sibuk. Silakan tunggu sebentar dan coba lagi.',
          timer: 3000
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update score'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSpeedSubmit = async (e) => {
    e.preventDefault()
    
    // Check if score is finalized/locked
    if (speedScore.is_finalized) {
      await Swal.fire({
        icon: 'warning',
        title: 'Score is Finalized',
        text: 'This score is locked. Please unlock it first to make changes.',
        confirmButtonText: 'OK'
      })
      return
    }

    try {
      setLoading(true)
      // Convert MM:SS.mmm format to seconds before sending
      const laneATimeSeconds = speedScore.lane_a_time ? parseTimeMMSSmmm(speedScore.lane_a_time) : null
      const laneBTimeSeconds = speedScore.lane_b_time ? parseTimeMMSSmmm(speedScore.lane_b_time) : null
      
      const response = await fetch(
        `/api/speed-competitions/${competition.id}/qualification/${climber.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            lane_a_time: laneATimeSeconds,
            lane_b_time: laneBTimeSeconds,
            lane_a_status: speedScore.lane_a_status,
            lane_b_status: speedScore.lane_b_status
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
          text: error.error || 'Failed to update score'
        })
      }
    } catch (error) {
      console.error('Error updating speed score:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update score'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !climber || !competition) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Input Score</h3>
            <p className="text-sm text-gray-600">
              {climber.name} - #{climber.bib_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {competition.type === 'boulder' ? (
          <div className="space-y-4">
            {boulderRoute ? (
              // Show only selected route
              (() => {
                const score = boulderScores[boulderRoute] || {
                  attempts: 0,
                  reached_zone: false,
                  reached_top: false,
                  is_finalized: false,
                  is_disqualified: false
                }
                const isDisqualified = score.is_disqualified === 1 || score.is_disqualified === true
                
                return (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-semibold text-gray-900">Jalur {boulderRoute}</h4>
                      <div className="flex items-center gap-2">
                        {(score.is_finalized || score.is_locked) && (
                          <>
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1">
                              <Lock size={12} />
                              Locked
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => handleUnlockScore('boulder_score', score.id)}
                                disabled={unlocking || !score.id}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                title="Unlock score (Admin only)"
                              >
                                <Unlock size={12} />
                                Unlock
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isDisqualified ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-700 font-semibold">Peserta Didiskualifikasi (N/A)</p>
                        <p className="text-sm text-red-600 mt-2">Peserta tidak hadir atau didiskualifikasi</p>
                        {!score.is_locked && (
                          <button
                            onClick={() => handleBoulderAction(boulderRoute, 'disqualify')}
                            disabled={loading}
                            className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Hapus Diskualifikasi
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-4">
                          <div className="text-sm text-gray-600">
                            Attempts: <span className="font-semibold text-lg">{score.attempts}</span>
                          </div>
                          {score.reached_zone && (
                            <div className="text-sm text-blue-600 font-semibold">
                              ✓ Zone: Attempt {score.zone_attempt}
                            </div>
                          )}
                          {score.reached_top && (
                            <div className="text-sm text-green-600 font-semibold">
                              ✓ Top: Attempt {score.top_attempt}
                            </div>
                          )}
                        </div>
                        {!score.is_locked && (
                          <div className="grid grid-cols-2 gap-3">
                            {/* Attempt button - always available (even after finalized) for record keeping */}
                            <button
                              onClick={() => handleBoulderActionDebounced(boulderRoute, 'attempt')}
                              disabled={loading || score.is_locked}
                              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 font-semibold shadow-sm"
                            >
                              + Attempt
                            </button>
                            {/* Zone/Top buttons - only available when not finalized */}
                            {!score.is_finalized && (
                              <>
                                {!score.reached_zone && (
                                  <button
                                    onClick={() => handleBoulderAction(boulderRoute, 'zone')}
                                    disabled={loading || score.attempts === 0 || score.is_locked}
                                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 active:scale-95 transition-all disabled:opacity-50 font-semibold shadow-sm"
                                  >
                                    Zone
                                  </button>
                                )}
                                {!score.reached_top && (
                                  <button
                                    onClick={() => handleBoulderAction(boulderRoute, 'top')}
                                    disabled={loading || score.attempts === 0 || score.is_locked}
                                    className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 active:scale-95 transition-all disabled:opacity-50 font-semibold shadow-sm"
                                  >
                                    Top
                                  </button>
                                )}
                              </>
                            )}
                            {/* Finalize button - available when not finalized, can finalize even with only attempts (no zone/top required) */}
                            {!score.is_finalized && (
                              <button
                                onClick={() => handleBoulderAction(boulderRoute, 'finalize')}
                                disabled={loading || score.attempts === 0 || score.is_locked}
                                className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 active:scale-95 transition-all disabled:opacity-50 font-semibold shadow-sm"
                                title={score.attempts === 0 ? 'Tambahkan attempt terlebih dahulu' : 'Finalize score (dapat digunakan meskipun hanya attempt, tanpa zone/top)'}
                              >
                                Finalize
                              </button>
                            )}
                            {/* Disqualify button - always available */}
                            <button
                              onClick={() => handleBoulderAction(boulderRoute, 'disqualify')}
                              disabled={loading}
                              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 active:scale-95 transition-all disabled:opacity-50 font-semibold col-span-2 shadow-sm"
                            >
                              N/A (Diskualifikasi)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Navigation Buttons for Route-based Mode */}
                    {boulderRoute && allClimbers.length > 1 && (
                      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            if (onNavigateClimber) {
                              onNavigateClimber('prev')
                            }
                          }}
                          disabled={!onNavigateClimber}
                          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-sm"
                        >
                          <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">Sebelumnya</span>
                          <span className="sm:hidden">Prev</span>
                        </button>
                        <span className="text-xs sm:text-sm text-gray-600 text-center flex-1">
                          {(() => {
                            const currentIndex = allClimbers.findIndex(c => c.id === climber.id)
                            const totalUnjudged = allClimbers.filter(c => {
                              const score = climberScores[c.id]
                              if (!score) return true
                              const isFinalized = score.is_finalized === 1 || score.is_finalized === true
                              return !isFinalized
                            }).length
                            return (
                              <>
                                <span className="block sm:hidden">{currentIndex + 1}/{allClimbers.length}</span>
                                <span className="hidden sm:block">{currentIndex + 1} / {allClimbers.length} ({totalUnjudged} belum dinilai)</span>
                              </>
                            )
                          })()}
                        </span>
                        <button
                          onClick={() => {
                            if (onNavigateClimber) {
                              onNavigateClimber('next')
                            }
                          }}
                          disabled={!onNavigateClimber}
                          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-sm"
                        >
                          <span className="hidden sm:inline">Selanjutnya</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()
            ) : (
              // Show all routes (original behavior)
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: competition.total_boulders || 4 }, (_, i) => {
                  const boulderNum = i + 1
                  const score = boulderScores[boulderNum] || {
                    attempts: 0,
                    reached_zone: false,
                    reached_top: false,
                    is_finalized: false,
                    is_disqualified: false
                  }

                  return (
                    <div key={boulderNum} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Boulder {boulderNum}</h4>
                        <div className="flex items-center gap-2">
                          {(score.is_finalized || score.is_locked) && (
                            <>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1">
                                <Lock size={12} />
                                Locked
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleUnlockScore('boulder_score', score.id)}
                                  disabled={unlocking || !score.id}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  title="Unlock score (Admin only)"
                                >
                                  <Unlock size={12} />
                                  Unlock
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          Attempts: <span className="font-semibold">{score.attempts}</span>
                        </div>
                        {score.reached_zone && (
                          <div className="text-xs text-blue-600">
                            Zone: Attempt {score.zone_attempt}
                          </div>
                        )}
                        {score.reached_top && (
                          <div className="text-xs text-green-600">
                            Top: Attempt {score.top_attempt}
                          </div>
                        )}
                        {!score.is_finalized && !score.is_locked && (
                          <div className="flex flex-col gap-2 mt-3">
                            <button
                              onClick={() => handleBoulderActionDebounced(boulderNum, 'attempt')}
                              disabled={loading}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 font-medium shadow-sm"
                            >
                              + Attempt
                            </button>
                            {!score.reached_zone && (
                              <button
                                onClick={() => handleBoulderAction(boulderNum, 'zone')}
                                disabled={loading || score.attempts === 0}
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 active:scale-95 transition-all disabled:opacity-50 font-medium shadow-sm"
                              >
                                Zone
                              </button>
                            )}
                            {!score.reached_top && (
                              <button
                                onClick={() => handleBoulderAction(boulderNum, 'top')}
                                disabled={loading || score.attempts === 0}
                                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 active:scale-95 transition-all disabled:opacity-50 font-medium shadow-sm"
                              >
                                Top
                              </button>
                            )}
                            {/* Finalize button - can finalize even with only attempts (no zone/top required) */}
                            <button
                              onClick={() => handleBoulderAction(boulderNum, 'finalize')}
                              disabled={loading || score.attempts === 0}
                              className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 active:scale-95 transition-all disabled:opacity-50 font-medium shadow-sm"
                              title={score.attempts === 0 ? 'Tambahkan attempt terlebih dahulu' : 'Finalize score (dapat digunakan meskipun hanya attempt, tanpa zone/top)'}
                            >
                              Finalize
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSpeedSubmit} className="space-y-4">
            {/* Locked Status for Speed */}
            {speedScore.is_finalized && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="text-red-600" size={20} />
                  <span className="text-red-700 font-semibold">Score is Locked</span>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      // Need to get score ID from API first
                      fetch(`/api/speed-competitions/${competition.id}/qualification`)
                        .then(res => res.json())
                        .then(data => {
                          const climberScore = data.find(s => s.climber_id === climber.id)
                          if (climberScore && climberScore.id) {
                            handleUnlockScore('speed_qualification', climberScore.id)
                          }
                        })
                    }}
                    disabled={unlocking}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Unlock size={14} />
                    Unlock
                  </button>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lane A Time (MM:SS.mmm)
                </label>
                <input
                  type="text"
                  value={speedScore.lane_a_time}
                  onChange={(e) => setSpeedScore({ ...speedScore, lane_a_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                  placeholder="00:06.500"
                  disabled={speedScore.is_finalized}
                  pattern="\d{1,2}:\d{2}\.\d{1,3}"
                />
                <p className="text-xs text-gray-500 mt-1">Format: MM:SS.mmm (contoh: 00:06.500 untuk 6.5 detik)</p>
                <select
                  value={speedScore.lane_a_status}
                  onChange={(e) => setSpeedScore({ ...speedScore, lane_a_status: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VALID">VALID</option>
                  <option value="FALL">FALL</option>
                  <option value="FALSE_START">FALSE_START</option>
                  <option value="DNS">DNS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lane B Time (MM:SS.mmm)
                </label>
                <input
                  type="text"
                  value={speedScore.lane_b_time}
                  onChange={(e) => setSpeedScore({ ...speedScore, lane_b_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                  placeholder="00:06.300"
                  disabled={speedScore.is_finalized}
                  pattern="\d{1,2}:\d{2}\.\d{1,3}"
                />
                <p className="text-xs text-gray-500 mt-1">Format: MM:SS.mmm (contoh: 00:06.300 untuk 6.3 detik)</p>
                <select
                  value={speedScore.lane_b_status}
                  onChange={(e) => setSpeedScore({ ...speedScore, lane_b_status: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={speedScore.is_finalized}
                >
                  <option value="VALID">VALID</option>
                  <option value="FALL">FALL</option>
                  <option value="FALSE_START">FALSE_START</option>
                  <option value="DNS">DNS</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || speedScore.is_finalized}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Saving...' : speedScore.is_finalized ? 'Score Locked' : 'Save Score'}
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

export default ScoreInputModal

