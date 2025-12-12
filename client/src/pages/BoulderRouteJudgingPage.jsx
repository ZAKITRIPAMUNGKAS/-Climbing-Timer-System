import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Lock, Unlock, Mountain } from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '../hooks/useAuth'
import { socketManager } from '../utils/socketManager'
import { LEGACY_EVENTS } from '../constants/socketEvents'
import { queueBoulderScoreUpdate } from '../utils/requestQueue'

function BoulderRouteJudgingPage() {
  const { competitionId, routeNumber } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const routeNum = parseInt(routeNumber)
  
  const [competition, setCompetition] = useState(null)
  const [climbers, setClimbers] = useState([])
  const [climberScores, setClimberScores] = useState({})
  const [currentClimberIndex, setCurrentClimberIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const debounceTimerRef = useRef(null)

  const currentClimber = climbers[currentClimberIndex] || null
  const currentScore = currentClimber ? climberScores[currentClimber.id] : null

  // Define fetch functions FIRST before using them in useEffect
  const fetchCompetition = useCallback(async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}`)
      if (response.ok) {
        const data = await response.json()
        setCompetition(data)
      }
    } catch (error) {
      console.error('Error fetching competition:', error)
    }
  }, [competitionId])

  const fetchClimbers = useCallback(async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}/climbers`)
      if (response.ok) {
        const data = await response.json()
        setClimbers(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching climbers:', error)
      setLoading(false)
    }
  }, [competitionId])

  const fetchClimberScores = useCallback(async () => {
    if (!climbers.length) return
    
    try {
      const climberIds = climbers.map(c => c.id).join(',')
      const response = await fetch(
        `/api/competitions/${competitionId}/boulders/batch?climberIds=${climberIds}&boulderNumbers=${routeNum}`,
        { cache: 'no-store' }
      )
      
      const scores = {}
      if (response.ok) {
        const scoreMap = await response.json()
        climbers.forEach(climber => {
          const key = `${climber.id}_${routeNum}`
          scores[climber.id] = scoreMap[key] || {
            id: null,
            competition_id: parseInt(competitionId),
            climber_id: climber.id,
            boulder_number: routeNum,
            attempts: 0,
            reached_zone: false,
            reached_top: false,
            zone_attempt: null,
            top_attempt: null,
            is_finalized: false,
            is_disqualified: false,
            is_locked: false
          }
        })
      } else {
        // Fallback to parallel requests
        const promises = climbers.map(climber =>
          fetch(`/api/competitions/${competitionId}/climbers/${climber.id}/boulders/${routeNum}`, { cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
        const scoreResults = await Promise.all(promises)
        climbers.forEach((climber, index) => {
          scores[climber.id] = scoreResults[index] || {
            id: null,
            competition_id: parseInt(competitionId),
            climber_id: climber.id,
            boulder_number: routeNum,
            attempts: 0,
            reached_zone: false,
            reached_top: false,
            zone_attempt: null,
            top_attempt: null,
            is_finalized: false,
            is_disqualified: false,
            is_locked: false
          }
        })
      }
      setClimberScores(scores)
    } catch (error) {
      console.error('Error fetching climber scores:', error)
    }
  }, [competitionId, routeNum, climbers])

  useEffect(() => {
    fetchCompetition()
    fetchClimbers()
  }, [fetchCompetition, fetchClimbers])

  useEffect(() => {
    if (climbers.length > 0) {
      fetchClimberScores()
    }
  }, [competitionId, routeNum, fetchClimberScores, climbers.length]) // Use climbers.length instead of climbers array
  
  // Setup socket listener untuk real-time score updates
  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket || !competitionId || !routeNum) return

    // Listen for boulder score updates
    const handleBoulderScoreUpdate = (data) => {
      if (data.competition_id === parseInt(competitionId) && data.boulder_number === routeNum) {
        // Update climberScores state directly from socket data
        if (data.score) {
          setClimberScores(prev => ({
            ...prev,
            [data.climber_id]: data.score
          }))
        }
      }
    }

    // Register fallback fetch on reconnect
    const reconnectKey = `boulder-route-judging-${competitionId}-${routeNum}`
    const unsubReconnect = socketManager.onReconnect(reconnectKey, () => {
      if (climbers.length > 0) {
        fetchClimberScores()
      }
    })

    const unsub = socketManager.on(LEGACY_EVENTS.SCORE_UPDATED, handleBoulderScoreUpdate)

    return () => {
      unsub()
      unsubReconnect()
    }
  }, [competitionId, routeNum, climbers.length, fetchClimberScores])

  const handleBoulderAction = async (action) => {
    if (!currentClimber) return
    
    // Check if score is finalized
    const scoreIsFinalized = currentScore?.is_finalized === 1 || currentScore?.is_finalized === true
    
    // Prevent actions if score is already finalized (except unlock for admin)
    if ((action === 'attempt' || action === 'zone' || action === 'top' || action === 'disqualify') && scoreIsFinalized) {
      await Swal.fire({
        icon: 'warning',
        title: 'Score Sudah Dfinalisasi',
        text: 'Score sudah di-finalisasi dan tidak dapat diubah. Silakan hubungi admin jika perlu membuka kunci.',
        customClass: {
          popup: 'text-sm'
        }
      })
      return
    }

    // Confirmation for critical actions
    if (action === 'top' || action === 'finalize' || action === 'disqualify') {
      const result = await Swal.fire({
        title: action === 'top' ? 'Tandai sebagai Top?' : action === 'disqualify' ? 'Diskualifikasi Peserta?' : 'Finalisasi Score?',
        text: action === 'top' 
          ? 'Ini akan otomatis memfinalisasi score. Yakin?'
          : action === 'disqualify'
          ? 'Peserta akan ditandai sebagai N/A (tidak hadir/diskualifikasi). Yakin?'
          : 'Ini akan mengunci score. Yakin?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: action === 'top' ? 'Ya, Tandai Top' : action === 'disqualify' ? 'Ya, Diskualifikasi' : 'Ya, Finalisasi',
        confirmButtonColor: action === 'disqualify' ? '#ef4444' : '#10b981',
        cancelButtonText: 'Batal',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        customClass: {
          popup: 'text-sm'
        }
      })

      if (!result.isConfirmed) return
    }

    try {
      setActionLoading(true)
      
      // Queue request untuk prevent data race conditions
      const response = await queueBoulderScoreUpdate(
        competitionId,
        currentClimber.id,
        routeNum,
        () => fetch(
          `/api/competitions/${competitionId}/climbers/${currentClimber.id}/boulders/${routeNum}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action })
          }
        )
      )

      if (response.ok) {
        const updatedScore = await response.json()
        
        // Optimistic update
        const normalizedScore = {
          ...updatedScore,
          is_finalized: updatedScore.is_finalized === 1 || updatedScore.is_finalized === true,
          is_locked: updatedScore.is_locked === 1 || updatedScore.is_locked === true,
          reached_zone: updatedScore.reached_zone === 1 || updatedScore.reached_zone === true,
          reached_top: updatedScore.reached_top === 1 || updatedScore.reached_top === true,
          is_disqualified: updatedScore.is_disqualified === 1 || updatedScore.is_disqualified === true
        }
        
        setClimberScores(prev => ({
          ...prev,
          [currentClimber.id]: normalizedScore
        }))

        // Auto-advance to next climber if finalized
        if ((action === 'finalize' || action === 'top') && currentClimberIndex < climbers.length - 1) {
          setTimeout(() => {
            setCurrentClimberIndex(prev => prev + 1)
          }, 300)
        }

        // Refresh in background
        fetchClimberScores()
      } else if (response.status === 429) {
        await Swal.fire({
          icon: 'warning',
          title: 'Terlalu Banyak Request',
          text: 'Server sedang sibuk. Silakan tunggu sebentar.',
          timer: 2000,
          customClass: {
            popup: 'text-sm'
          }
        })
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to update score' }))
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'Gagal mengupdate score',
          customClass: {
            popup: 'text-sm'
          }
        })
      }
    } catch (error) {
      console.error('Error updating score:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengupdate score',
        customClass: {
          popup: 'text-sm'
        }
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBoulderActionDebounced = useCallback((action) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    if (action === 'attempt') {
      debounceTimerRef.current = setTimeout(() => {
        handleBoulderAction(action)
      }, 150)
    } else {
      handleBoulderAction(action)
    }
  }, [currentClimber?.id, routeNum, competitionId])

  const handleUnlockScore = async () => {
    if (!currentScore?.id) return

    const { value: reason } = await Swal.fire({
      title: 'Unlock Score',
      html: `
        <p class="text-left mb-4 text-sm">Berikan alasan untuk membuka kunci score:</p>
        <textarea 
          id="reason" 
          class="swal2-textarea" 
          placeholder="Masukkan alasan (minimal 10 karakter)..."
          rows="3"
        ></textarea>
      `,
      input: 'textarea',
      inputPlaceholder: 'Masukkan alasan...',
      inputAttributes: {
        id: 'reason',
        rows: 3
      },
      showCancelButton: true,
      confirmButtonText: 'Unlock',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Alasan minimal 10 karakter'
        }
      },
      preConfirm: () => {
        const reasonInput = document.getElementById('reason')
        return reasonInput ? reasonInput.value : ''
      },
      customClass: {
        popup: 'text-sm'
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
          entity_type: 'boulder_score',
          entity_id: currentScore.id
        })
      })

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Score Terbuka',
          text: 'Score dapat diedit sekarang.',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'text-sm'
          }
        })
        fetchClimberScores()
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Gagal Unlock',
          text: error.error || 'Gagal membuka kunci score',
          customClass: {
            popup: 'text-sm'
          }
        })
      }
    } catch (error) {
      console.error('Error unlocking score:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal membuka kunci score',
        customClass: {
          popup: 'text-sm'
        }
      })
    } finally {
      setUnlocking(false)
    }
  }

  const navigateClimber = (direction) => {
    if (direction === 'next' && currentClimberIndex < climbers.length - 1) {
      setCurrentClimberIndex(prev => prev + 1)
    } else if (direction === 'prev' && currentClimberIndex > 0) {
      setCurrentClimberIndex(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isDisqualified = currentScore?.is_disqualified === 1 || currentScore?.is_disqualified === true
  const isFinalized = currentScore?.is_finalized === 1 || currentScore?.is_finalized === true
  const isLocked = currentScore?.is_locked === 1 || currentScore?.is_locked === true

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
              aria-label="Kembali"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {competition?.name || 'Penilaian'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Mountain size={16} className="text-blue-600" />
                <span className="text-sm text-gray-600">Jalur {routeNum}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Peserta {currentClimberIndex + 1} dari {climbers.length}</span>
          <span>{Math.round(((currentClimberIndex + 1) / climbers.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentClimberIndex + 1) / climbers.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current Climber Info - Mobile Optimized */}
      {currentClimber && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  #{currentClimber.bib_number}
                </span>
                {isLocked && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1">
                    <Lock size={12} />
                    Terkunci
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 truncate">{currentClimber.name}</h2>
              {currentClimber.team && (
                <p className="text-sm text-gray-600 mt-1">{currentClimber.team}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Score Display - Mobile Optimized */}
      {currentClimber && currentScore && (
        <div className="px-4 py-6 bg-white">
          {isDisqualified ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-bold text-lg mb-2">Peserta Didiskualifikasi (N/A)</p>
              <p className="text-sm text-red-600">Peserta tidak hadir atau didiskualifikasi</p>
              {!isLocked && (
                <button
                  onClick={() => handleBoulderAction('disqualify')}
                  disabled={actionLoading}
                  className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
                >
                  Hapus Diskualifikasi
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Score Stats */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{currentScore.attempts || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Attempts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {currentScore.reached_zone ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Zone</div>
                    {currentScore.reached_zone && (
                      <div className="text-xs text-blue-600 mt-1">
                        Attempt {currentScore.zone_attempt}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {currentScore.reached_top ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Top</div>
                    {currentScore.reached_top && (
                      <div className="text-xs text-green-600 mt-1">
                        Attempt {currentScore.top_attempt}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Mobile Optimized Large Buttons */}
              {!isLocked && (
                <div className="space-y-3">
                  {/* Attempt Button */}
                  <button
                    onClick={() => handleBoulderActionDebounced('attempt')}
                    disabled={actionLoading || isFinalized}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold text-lg shadow-sm active:scale-95"
                  >
                    + Attempt
                  </button>
                  {isFinalized && (
                    <p className="text-xs text-gray-500 text-center mt-1">Score sudah di-finalisasi</p>
                  )}

                  {/* Zone and Top Buttons - Side by Side */}
                  {!isFinalized && (
                    <div className="grid grid-cols-2 gap-3">
                      {!currentScore.reached_zone && (
                        <button
                          onClick={() => handleBoulderAction('zone')}
                          disabled={actionLoading || (currentScore.attempts || 0) === 0}
                          className="py-4 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors disabled:opacity-50 font-bold text-lg shadow-sm active:scale-95"
                        >
                          Zone
                        </button>
                      )}
                      {!currentScore.reached_top && (
                        <button
                          onClick={() => handleBoulderAction('top')}
                          disabled={actionLoading || (currentScore.attempts || 0) === 0}
                          className="py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50 font-bold text-lg shadow-sm active:scale-95"
                        >
                          Top
                        </button>
                      )}
                    </div>
                  )}

                  {/* Finalize Button */}
                  {!isFinalized && (
                    <button
                      onClick={() => handleBoulderAction('finalize')}
                      disabled={actionLoading || (currentScore.attempts || 0) === 0}
                      className="w-full py-4 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors disabled:opacity-50 font-bold text-lg shadow-sm active:scale-95"
                    >
                      Finalisasi
                    </button>
                  )}

                  {/* Disqualify Button */}
                  <button
                    onClick={() => handleBoulderAction('disqualify')}
                    disabled={actionLoading}
                    className="w-full py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 font-bold text-lg shadow-sm active:scale-95"
                  >
                    N/A (Diskualifikasi)
                  </button>

                  {/* Unlock Button (Admin) */}
                  {isAdmin && isLocked && (
                    <button
                      onClick={handleUnlockScore}
                      disabled={unlocking}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Unlock size={18} />
                      {unlocking ? 'Membuka...' : 'Unlock Score (Admin)'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Navigation Buttons - Fixed Bottom Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-10">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigateClimber('prev')}
            disabled={currentClimberIndex === 0}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 active:scale-95"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="sm:hidden">Prev</span>
          </button>
          
          <div className="text-center min-w-[80px]">
            <div className="text-sm font-semibold text-gray-700">
              {currentClimberIndex + 1} / {climbers.length}
            </div>
            <div className="text-xs text-gray-500">peserta</div>
          </div>

          <button
            onClick={() => navigateClimber('next')}
            disabled={currentClimberIndex === climbers.length - 1}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default BoulderRouteJudgingPage

