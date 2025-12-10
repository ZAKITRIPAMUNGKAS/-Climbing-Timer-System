import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, TrendingUp, Award, Target, Info, Search, FileText, Download, Monitor, Activity } from 'lucide-react'
import LeaderboardCard from '../components/LeaderboardCard'
import PublicLayout from '../components/PublicLayout'
import { generateStartListPDF, generateResultListExcel } from '../utils/pdfExport'

function LiveScorePage() {
  const [competition, setCompetition] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([])
  const [climbers, setClimbers] = useState([]) // For Start List PDF
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false) // Indicator for real-time updates
  const [currentClimber, setCurrentClimber] = useState(null) // Current climber data
  const [currentClimberScore, setCurrentClimberScore] = useState(null) // Latest score for current climber
  const socketRef = useRef(null)

  useEffect(() => {
    // Get competition ID from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const competitionId = urlParams.get('competition')

    if (!competitionId) {
      // Redirect to selector if no competition ID
      window.location.href = '/live-score-selector'
      return
    }

    const compId = parseInt(competitionId)

    // Initialize socket connection
    socketRef.current = io()

    // Listen for score updates from judge interface
    socketRef.current.on('score-updated', (data) => {
      console.log('[LIVE SCORE] Score updated from judge interface:', data)
      // Refresh leaderboard when score is updated (check by competition_id)
      if (data.competition_id === compId) {
        console.log('[LIVE SCORE] Refreshing leaderboard for competition:', compId)
        fetchLeaderboard(compId)
        // Update current climber when score is updated
        if (data.climber_id) {
          fetchCurrentClimber(compId, data.climber_id, data.boulder_number)
        }
      }
    })

    // Fetch competition by ID
    fetchCompetition(compId)

    return () => {
      if (socketRef.current) {
        socketRef.current.off('score-updated')
        socketRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (competition) {
      fetchLeaderboard(competition.id)
      fetchClimbers(competition.id)
      // Fetch initial current climber (first climber or most recent)
      fetchInitialCurrentClimber(competition.id)
    }
  }, [competition])

  const fetchClimbers = async (competitionId) => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}/climbers`)
      if (response.ok) {
        const data = await response.json()
        setClimbers(data)
      }
    } catch (error) {
      console.error('Error fetching climbers:', error)
    }
  }

  const handleExportStartList = () => {
    if (climbers.length === 0) {
      alert('Tidak ada atlet yang tersedia untuk Start List')
      return
    }
    generateStartListPDF(climbers, competition, 'Qualification')
  }

  const handleExportResultList = () => {
    if (leaderboard.length === 0) {
      alert('Tidak ada hasil yang tersedia untuk Result List')
      return
    }
    generateResultListExcel(leaderboard, competition, 'Qualification')
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLeaderboard(leaderboard)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredLeaderboard(
        leaderboard.filter(climber =>
          climber.name?.toLowerCase().includes(query) ||
          climber.team?.toLowerCase().includes(query) ||
          climber.bib_number?.toString().includes(query)
        )
      )
    }
  }, [searchQuery, leaderboard])

  const fetchCompetition = async (competitionId) => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}`)
      if (response.ok) {
        const data = await response.json()
        setCompetition(data)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching competition:', error)
      setLoading(false)
    }
  }

  const fetchLeaderboard = async (competitionId = null) => {
    const compId = competitionId || competition?.id
    if (!compId) return

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/competitions/${compId}/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
        setFilteredLeaderboard(data)
        setLoading(false)
        // Reset updating indicator after a short delay
        setTimeout(() => setIsUpdating(false), 1000)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLoading(false)
      setIsUpdating(false)
    }
  }

  // Fetch current climber when score is updated
  const fetchCurrentClimber = async (compId, climberId, boulderNumber) => {
    try {
      // Fetch climber data
      const climberResponse = await fetch(`/api/competitions/${compId}/climbers`)
      if (climberResponse.ok) {
        const climbers = await climberResponse.json()
        const climber = climbers.find(c => c.id === climberId)
        if (climber) {
          setCurrentClimber(climber)
          
          // Get from leaderboard (which has formatted scores)
          const leaderboardResponse = await fetch(`/api/competitions/${compId}/leaderboard`)
          if (leaderboardResponse.ok) {
            const leaderboardData = await leaderboardResponse.json()
            const climberData = leaderboardData.find(c => c.id === climberId)
            if (climberData && climberData.scores) {
              // Find the specific boulder or get the latest one
              let targetScore = null
              if (boulderNumber) {
                targetScore = climberData.scores.find(s => 
                  (s.boulder_number === parseInt(boulderNumber) || s.boulder_number === boulderNumber) &&
                  (s.topAttempts > 0 || s.zoneAttempts > 0)
                )
              }
              
              // If not found by boulder number, get the latest score
              if (!targetScore) {
                const scores = climberData.scores.filter(s => s.topAttempts > 0 || s.zoneAttempts > 0)
                if (scores.length > 0) {
                  targetScore = scores[scores.length - 1]
                }
              }
              
              if (targetScore) {
                setCurrentClimberScore({
                  boulder_number: targetScore.boulder_number || 1,
                  topAttempts: targetScore.topAttempts || 0,
                  zoneAttempts: targetScore.zoneAttempts || 0,
                  reached_top: targetScore.isTop || false,
                  reached_zone: targetScore.isZone || false
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current climber:', error)
    }
  }

  // Fetch initial current climber (most recent or first)
  const fetchInitialCurrentClimber = async (compId) => {
    try {
      const leaderboardResponse = await fetch(`/api/competitions/${compId}/leaderboard`)
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json()
        // Find climber with most recent activity (has scores)
        const climberWithScores = leaderboardData.find(c => 
          c.scores && c.scores.some(s => s.topAttempts > 0 || s.zoneAttempts > 0)
        )
        
        if (climberWithScores) {
          const climberResponse = await fetch(`/api/competitions/${compId}/climbers`)
          if (climberResponse.ok) {
            const climbers = await climberResponse.json()
            const climber = climbers.find(c => c.id === climberWithScores.id)
            if (climber) {
              setCurrentClimber(climber)
              // Get latest score
              const scores = climberWithScores.scores.filter(s => s.topAttempts > 0 || s.zoneAttempts > 0)
              if (scores.length > 0) {
                const latestScore = scores[scores.length - 1]
                setCurrentClimberScore({
                  boulder_number: latestScore.boulder_number || scores.length,
                  topAttempts: latestScore.topAttempts || 0,
                  zoneAttempts: latestScore.zoneAttempts || 0,
                  reached_top: latestScore.isTop || false,
                  reached_zone: latestScore.isZone || false
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching initial current climber:', error)
    }
  }

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800] mb-4"></div>
            <div className="text-xl font-bold mb-2 text-[#FFB800] tracking-wider">LOADING DATA</div>
            <p className="text-zinc-500 text-sm tracking-widest uppercase">Please wait</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!competition) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-[#121212] rounded-none border border-zinc-800 p-10 shadow-2xl">
              <Trophy className="mx-auto mb-6 text-[#FFB800]" size={48} />
              <div className="text-2xl font-bold mb-4 text-zinc-100 uppercase tracking-wider">No Active Competition</div>
              <p className="text-zinc-500 mb-8 font-light">Please contact the administrator to create a competition.</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#FFB800] text-black font-bold uppercase tracking-wider hover:bg-[#ffc933] transition-all duration-200"
              >
                <ArrowLeft size={18} />
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // --- MAIN RENDER ---

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans pt-20 sm:pt-24 md:pt-20 pb-12 overflow-x-hidden selection:bg-[#FFB800] selection:text-black">
        
        {/* Header Section */}
        <div className="bg-[#121212] border-b border-zinc-800 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              
              {/* Title & Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 mb-1">
                   <div className={`w-2 h-2 rounded-full ${competition.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                   <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase">
                     {competition.status === 'active' ? 'Live Scoring' : 'Competition Ended'}
                   </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-zinc-100 tracking-tighter uppercase leading-none">
                  Boulder Lead
                  <span className="text-[#FFB800]">.</span>
                </h1>
                <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
                  <span className="uppercase tracking-wider">{competition.name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Link
                  to={`/big-screen/${competition.id}`}
                  target="_blank"
                  className="group px-4 py-2 bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800] hover:text-black transition-all duration-300 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  <Monitor size={14} />
                  <span>Big Screen</span>
                </Link>

                <div className="h-6 w-px bg-zinc-800 mx-2 hidden sm:block"></div>

                <button
                  onClick={handleExportStartList}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#FFB800] hover:text-[#FFB800] transition-all duration-300 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-zinc-400"
                >
                  <FileText size={14} />
                  <span>Start List</span>
                </button>
                <button
                  onClick={handleExportResultList}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#FFB800] hover:text-[#FFB800] transition-all duration-300 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-zinc-400"
                >
                  <Download size={14} />
                  <span>Results</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
          
          {/* Controls & Search */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
            <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-600 group-focus-within:text-[#FFB800] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search athlete, team, or bib..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-sm leading-5 bg-[#0a0a0a] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] sm:text-sm transition-all duration-300"
              />
            </div>

            {/* Live Indicator / Count */}
            <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
              {isUpdating && (
                <div className="flex items-center gap-2 text-[#FFB800] animate-pulse">
                  <Activity size={14} />
                  <span>Updating Scores...</span>
                </div>
              )}
              <div>
                Showing <span className="text-zinc-300">{filteredLeaderboard.length}</span> Athletes
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header Row for Leaderboard (Broadcast Style) */}
             <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#121212] border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2 rounded-t-sm hidden md:grid">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4 flex items-center gap-2">
                  <TrendingUp className="text-[#FFB800]" size={14} />
                  Athlete
                </div>
                <div className="col-span-2 text-center">Top / Zone</div>
                <div className="col-span-2 text-center">Attempts</div>
                <div className="col-span-3 text-right">Total Points</div>
             </div>

             <div className="space-y-2">
                {filteredLeaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-sm">
                    <div className="bg-[#121212] p-4 rounded-full mb-4">
                      <Target className="text-zinc-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      {searchQuery ? 'No Results Found' : 'No Data Available'}
                    </h3>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded transition-colors border border-zinc-800"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredLeaderboard.map((climber, index) => (
                    <div key={climber.id} className="transition-transform duration-200 hover:scale-[1.005]">
                       <LeaderboardCard climber={climber} index={index} />
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Rules & Info Section */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Scoring Rules */}
            <div className="bg-[#121212] border border-zinc-800 p-6 rounded-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award size={100} className="text-[#FFB800]" />
               </div>
               <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#FFB800] block"></span>
                  FPTI Scoring System
               </h3>
               
               <div className="space-y-4 font-mono text-sm">
                  <div className="flex flex-col bg-zinc-900/50 p-4 rounded-sm border-l-2 border-[#FFB800]">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[#FFB800] font-bold">TOP</span>
                        <span className="text-zinc-100 font-bold">25.0 pts</span>
                     </div>
                     <div className="text-zinc-500 text-xs">
                        Base score. Reduced by 0.1 for each additional attempt.
                        <br/>
                        Formula: <span className="text-zinc-400">25.0 - ((attempts - 1) × 0.1)</span>
                     </div>
                  </div>

                  <div className="flex flex-col bg-zinc-900/50 p-4 rounded-sm border-l-2 border-zinc-700">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-zinc-400 font-bold">ZONE</span>
                        <span className="text-zinc-100 font-bold">10.0 pts</span>
                     </div>
                     <div className="text-zinc-500 text-xs">
                        Awarded if TOP is not reached. Reduced by 0.1 per attempt.
                        <br/>
                        Formula: <span className="text-zinc-400">10.0 - ((attempts - 1) × 0.1)</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Legend & Notes */}
            <div className="bg-[#121212] border border-zinc-800 p-6 rounded-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Info size={100} className="text-zinc-600" />
               </div>
               <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-zinc-700 block"></span>
                  Key Notes
               </h3>

               <ul className="space-y-4 text-sm text-zinc-400">
                  <li className="flex gap-3 items-start">
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#FFB800] flex-shrink-0"></div>
                     <p>If <strong className="text-zinc-200">TOP</strong> is reached, ZONE points are ignored (not cumulative).</p>
                  </li>
                  <li className="flex gap-3 items-start">
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0"></div>
                     <p>Ranking is determined by the <strong className="text-zinc-200">Highest Total Points</strong> across all boulders.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0"></div>
                     <p>Attempts are crucial. A flash (1st attempt) is worth significantly more than multiple attempts in tie-breaker scenarios.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0"></div>
                     <p>Filled squares indicate successful TOP or ZONE achievement.</p>
                  </li>
               </ul>
            </div>

          </div>

        </main>
      </div>
    </PublicLayout>
  )
}

export default LiveScorePage