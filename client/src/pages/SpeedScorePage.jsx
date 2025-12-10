import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Timer, Users, Search, FileText, Download, Monitor } from 'lucide-react'
import QualificationCard from '../components/QualificationCard'
import MatchVersusCard from '../components/MatchVersusCard'
import SpeedBracketView from '../components/SpeedBracketView'
import MatchDetailModal from '../components/MatchDetailModal'
import PublicLayout from '../components/PublicLayout'
import { generateStartListPDF, generateResultListExcel } from '../utils/pdfExport'

function SpeedScorePage() {
  const [competition, setCompetition] = useState(null)
  const [qualification, setQualification] = useState([])
  const [filteredQualification, setFilteredQualification] = useState([])
  const [finals, setFinals] = useState([])
  const [filteredFinals, setFilteredFinals] = useState([])
  const [climbers, setClimbers] = useState([]) // For Start List PDF
  const [activeTab, setActiveTab] = useState('qualification') // 'qualification' or 'finals'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showMatchDetail, setShowMatchDetail] = useState(false)
  const socketRef = useRef(null)
  const competitionIdRef = useRef(null)

  useEffect(() => {
    // Get competition ID and round from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const competitionId = urlParams.get('competition')
    const round = urlParams.get('round')

    if (!competitionId || !round) {
      // Redirect to selector if no competition ID or round
      window.location.href = '/live-score-selector'
      return
    }

    const compId = parseInt(competitionId)
    competitionIdRef.current = compId

    // Set active tab based on round - Reset state when switching
    setActiveTab(round)
    setQualification([])
    setFinals([])

    // Fetch competition by ID
    fetchCompetition(compId)

    // Initialize socket connection
    socketRef.current = io()

    // Listen for score updates
    const handleQualificationUpdate = (data) => {
      console.log('Speed qualification updated:', data)
      if (data.speed_competition_id === competitionIdRef.current) {
        fetchQualification(competitionIdRef.current)
      }
    }

    const handleFinalsUpdate = (data) => {
      console.log('Speed finals updated:', data)
      if (data.speed_competition_id === competitionIdRef.current) {
        fetchFinals(competitionIdRef.current)
      }
    }

    socketRef.current.on('speed-qualification-updated', handleQualificationUpdate)
    socketRef.current.on('speed-finals-updated', handleFinalsUpdate)

    return () => {
      if (socketRef.current) {
        socketRef.current.off('speed-qualification-updated', handleQualificationUpdate)
        socketRef.current.off('speed-finals-updated', handleFinalsUpdate)
        socketRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (competition) {
      // Reset and fetch fresh data when tab changes
      if (activeTab === 'qualification') {
        setFinals([])
        fetchQualification(competition.id)
      } else {
        setQualification([])
        fetchFinals(competition.id)
      }
      fetchClimbers(competition.id)
    }
  }, [competition, activeTab])

  const fetchClimbers = async (competitionId) => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/climbers`)
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
    const round = activeTab === 'qualification' ? 'Qualification' : 'Finals'
    generateStartListPDF(climbers, { ...competition, type: 'speed' }, round)
  }

  const handleExportResultList = () => {
    const data = activeTab === 'qualification' ? qualification : finals
    if (data.length === 0) {
      alert('Tidak ada hasil yang tersedia untuk Result List')
      return
    }
    const round = activeTab === 'qualification' ? 'Qualification' : 'Finals'
    
    if (activeTab === 'qualification') {
      // For qualification, use the data directly
      generateResultListExcel(qualification, { ...competition, type: 'speed' }, round)
    } else {
      // For finals, create a complete final ranking list
      // Collect all climbers with their final results and determine ranking
      const climberResultsMap = new Map()
      const climberMatchHistory = new Map() // Track match history for each climber
      
      // Process all matches to collect climber data and history
      finals.forEach((match) => {
        // Process Climber A
        if (match.climber_a_name) {
          const run1Time = match.climber_a_run1_time ? parseFloat(match.climber_a_run1_time) : null
          const run2Time = match.climber_a_run2_time ? parseFloat(match.climber_a_run2_time) : null
          const totalTime = match.climber_a_total_time ? parseFloat(match.climber_a_total_time) : 
                           (run1Time && run2Time && 
                            match.climber_a_run1_status === 'VALID' && 
                            match.climber_a_run2_status === 'VALID' ? 
                            run1Time + run2Time : null)
          
          const status = (match.climber_a_run1_status === 'VALID' && 
                         match.climber_a_run2_status === 'VALID' && 
                         run1Time && run2Time) ? 'VALID' : 'INVALID'
          
          const climberId = match.climber_a_id
          if (!climberResultsMap.has(climberId)) {
            climberResultsMap.set(climberId, {
              id: climberId,
              rank: match.climber_a_rank || null,
            bib_number: match.climber_a_bib || '-',
            name: match.climber_a_name || '-',
            team: match.climber_a_team || '-',
              lane_a_time: null,
            lane_b_time: null,
              total_time: null,
              status: status,
              stage: match.stage,
              isWinner: match.winner_id === climberId,
              finalStage: match.stage
            })
            climberMatchHistory.set(climberId, [])
          }
          
          // Add to match history
          const history = climberMatchHistory.get(climberId)
          const opponentName = match.climber_b_name || 'BYE'
          const isWinner = match.winner_id === climberId
          history.push({
            stage: match.stage,
            match_order: match.match_order,
            opponent: opponentName,
            result: isWinner ? 'W' : 'L',
            total_time: totalTime
          })
          
          const climberData = climberResultsMap.get(climberId)
          // Update with latest match data (prioritize later stages)
          const stagePriority = {
            'Round of 16': 1,
            'Quarter Final': 2,
            'Semi Final': 3,
            'Small Final': 4,
            'Big Final': 5
          }
          const currentPriority = stagePriority[climberData.finalStage] || 0
          const newPriority = stagePriority[match.stage] || 0
          
          if (newPriority >= currentPriority) {
            climberData.lane_a_time = run1Time // Run 1 = Lane A
            climberData.lane_b_time = run2Time // Run 2 = Lane B
            // Ensure total_time is calculated if not present
            climberData.total_time = totalTime || 
              (run1Time && run2Time && 
               match.climber_a_run1_status === 'VALID' && 
               match.climber_a_run2_status === 'VALID' ? 
               run1Time + run2Time : null)
            climberData.status = status
            climberData.finalStage = match.stage
            climberData.isWinner = match.winner_id === climberId
          }
        }
        
        // Process Climber B
        if (match.climber_b_name) {
          const run1Time = match.climber_b_run1_time ? parseFloat(match.climber_b_run1_time) : null
          const run2Time = match.climber_b_run2_time ? parseFloat(match.climber_b_run2_time) : null
          const totalTime = match.climber_b_total_time ? parseFloat(match.climber_b_total_time) : 
                           (run1Time && run2Time && 
                            match.climber_b_run1_status === 'VALID' && 
                            match.climber_b_run2_status === 'VALID' ? 
                            run1Time + run2Time : null)
          
          const status = (match.climber_b_run1_status === 'VALID' && 
                         match.climber_b_run2_status === 'VALID' && 
                         run1Time && run2Time) ? 'VALID' : 'INVALID'
          
          const climberId = match.climber_b_id
          if (!climberResultsMap.has(climberId)) {
            climberResultsMap.set(climberId, {
              id: climberId,
              rank: match.climber_b_rank || null,
            bib_number: match.climber_b_bib || '-',
            name: match.climber_b_name || '-',
            team: match.climber_b_team || '-',
            lane_a_time: null,
              lane_b_time: null,
              total_time: null,
              status: status,
              stage: match.stage,
              isWinner: match.winner_id === climberId,
              finalStage: match.stage
            })
            climberMatchHistory.set(climberId, [])
          }
          
          // Add to match history
          const history = climberMatchHistory.get(climberId)
          const opponentName = match.climber_a_name || 'BYE'
          const isWinner = match.winner_id === climberId
          history.push({
            stage: match.stage,
            match_order: match.match_order,
            opponent: opponentName,
            result: isWinner ? 'W' : 'L',
            total_time: totalTime
          })
          
          const climberData = climberResultsMap.get(climberId)
          // Update with latest match data (prioritize later stages)
          const stagePriority = {
            'Round of 16': 1,
            'Quarter Final': 2,
            'Semi Final': 3,
            'Small Final': 4,
            'Big Final': 5
          }
          const currentPriority = stagePriority[climberData.finalStage] || 0
          const newPriority = stagePriority[match.stage] || 0
          
          if (newPriority >= currentPriority) {
            climberData.lane_a_time = run2Time // Run 2 = Lane A (Climber B climbs Lane A in Run 2)
            climberData.lane_b_time = run1Time // Run 1 = Lane B (Climber B climbs Lane B in Run 1)
            // Ensure total_time is calculated if not present
            climberData.total_time = totalTime || 
              (run1Time && run2Time && 
               match.climber_b_run1_status === 'VALID' && 
               match.climber_b_run2_status === 'VALID' ? 
               run1Time + run2Time : null)
            climberData.status = status
            climberData.finalStage = match.stage
            climberData.isWinner = match.winner_id === climberId
          }
        }
      })
      
      // Determine final ranking based on stage and results
      // Big Final: Winner = Rank 1, Loser = Rank 2
      // Small Final: Winner = Rank 3, Loser = Rank 4
      // Semi Final losers (not in Small Final): Rank 5-6
      // Quarter Final losers (not in Semi Final): Rank 7-8
      // etc.
      const resultList = Array.from(climberResultsMap.values())
      
      // Find Big Final and Small Final matches
      const bigFinal = finals.find(m => m.stage === 'Big Final')
      const smallFinal = finals.find(m => m.stage === 'Small Final')
      const semiFinals = finals.filter(m => m.stage === 'Semi Final')
      const quarterFinals = finals.filter(m => m.stage === 'Quarter Final')
      
      // Assign ranks
      resultList.forEach(climber => {
        // Big Final
        if (bigFinal) {
          if (bigFinal.winner_id === climber.id) {
            climber.rank = 1
          } else if (bigFinal.climber_a_id === climber.id || bigFinal.climber_b_id === climber.id) {
            climber.rank = 2
          }
        }
        
        // Small Final
        if (smallFinal && !climber.rank) {
          if (smallFinal.winner_id === climber.id) {
            climber.rank = 3
          } else if (smallFinal.climber_a_id === climber.id || smallFinal.climber_b_id === climber.id) {
            climber.rank = 4
          }
        }
        
        // Semi Final losers (not in Small Final or Big Final)
        if (!climber.rank && semiFinals.length > 0) {
          const isInSmallFinal = smallFinal && 
            (smallFinal.climber_a_id === climber.id || smallFinal.climber_b_id === climber.id)
          const isInBigFinal = bigFinal && 
            (bigFinal.climber_a_id === climber.id || bigFinal.climber_b_id === climber.id)
          const isSemiLoser = semiFinals.some(m => 
            (m.climber_a_id === climber.id || m.climber_b_id === climber.id) && 
            m.winner_id !== climber.id
          )
          
          if (isSemiLoser && !isInSmallFinal && !isInBigFinal) {
            // Collect all semi final losers and sort by total time
            const semiLosers = resultList.filter(c => {
              const isLoser = semiFinals.some(m => 
                (m.climber_a_id === c.id || m.climber_b_id === c.id) && 
                m.winner_id !== c.id
              )
              const notInSmall = !smallFinal || 
                (smallFinal.climber_a_id !== c.id && smallFinal.climber_b_id !== c.id)
              const notInBig = !bigFinal || 
                (bigFinal.climber_a_id !== c.id && bigFinal.climber_b_id !== c.id)
              return isLoser && notInSmall && notInBig
            })
            
            // Sort by total time from their semi final match
            semiLosers.sort((a, b) => {
              const aTime = a.total_time || 999999
              const bTime = b.total_time || 999999
              return aTime - bTime
            })
            
            // Assign ranks 5, 6, etc.
            const loserIndex = semiLosers.findIndex(c => c.id === climber.id)
            if (loserIndex >= 0) {
              climber.rank = 5 + loserIndex
            }
          }
        }
        
        // Quarter Final losers (not in Semi Final, Small Final, or Big Final)
        if (!climber.rank && quarterFinals.length > 0) {
          const isInSemiFinal = semiFinals.some(m => 
            m.climber_a_id === climber.id || m.climber_b_id === climber.id
          )
          const isInSmallFinal = smallFinal && 
            (smallFinal.climber_a_id === climber.id || smallFinal.climber_b_id === climber.id)
          const isInBigFinal = bigFinal && 
            (bigFinal.climber_a_id === climber.id || bigFinal.climber_b_id === climber.id)
          const isQuarterLoser = quarterFinals.some(m => 
            (m.climber_a_id === climber.id || m.climber_b_id === climber.id) && 
            m.winner_id !== climber.id
          )
          
          if (isQuarterLoser && !isInSemiFinal && !isInSmallFinal && !isInBigFinal) {
            // Collect all quarter final losers and sort by total time
            const quarterLosers = resultList.filter(c => {
              const isLoser = quarterFinals.some(m => 
                (m.climber_a_id === c.id || m.climber_b_id === c.id) && 
                m.winner_id !== c.id
              )
              const notInSemi = !semiFinals.some(m => 
                m.climber_a_id === c.id || m.climber_b_id === c.id
              )
              const notInSmall = !smallFinal || 
                (smallFinal.climber_a_id !== c.id && smallFinal.climber_b_id !== c.id)
              const notInBig = !bigFinal || 
                (bigFinal.climber_a_id !== c.id && bigFinal.climber_b_id !== c.id)
              return isLoser && notInSemi && notInSmall && notInBig
            })
            
            // Sort by total time from their quarter final match
            quarterLosers.sort((a, b) => {
              const aTime = a.total_time || 999999
              const bTime = b.total_time || 999999
              return aTime - bTime
            })
            
            // Assign ranks starting from 7
            const loserIndex = quarterLosers.findIndex(c => c.id === climber.id)
            if (loserIndex >= 0) {
              // Count how many climbers already have ranks (1-6)
              const rankedCount = resultList.filter(c => c.rank && typeof c.rank === 'number' && c.rank <= 6).length
              climber.rank = 7 + loserIndex
            }
          }
        }
        
        // If still no rank, use qualification rank or assign based on stage
        if (!climber.rank) {
          climber.rank = climber.rank || '-'
        }
      })
      
      // Recalculate total_time for all climbers if missing
      resultList.forEach(climber => {
        if (!climber.total_time && climber.lane_a_time && climber.lane_b_time) {
          climber.total_time = climber.lane_a_time + climber.lane_b_time
        }
      })
      
      // Sort by rank (1, 2, 3, ...) then by total_time for same rank
      resultList.sort((a, b) => {
        if (a.rank !== '-' && b.rank !== '-' && a.rank !== null && b.rank !== null) {
          if (a.rank !== b.rank) return a.rank - b.rank
        }
        if (a.total_time && b.total_time) return a.total_time - b.total_time
        if (a.total_time) return -1
        if (b.total_time) return 1
        return 0
      })
      
      // Add bracket history to each climber
      resultList.forEach(climber => {
        const history = climberMatchHistory.get(climber.id) || []
        // Sort history by stage priority
        const stagePriority = {
          'Round of 16': 1,
          'Quarter Final': 2,
          'Semi Final': 3,
          'Small Final': 4,
          'Big Final': 5
        }
        history.sort((a, b) => {
          const priorityA = stagePriority[a.stage] || 99
          const priorityB = stagePriority[b.stage] || 99
          if (priorityA !== priorityB) return priorityA - priorityB
          return (a.match_order || 0) - (b.match_order || 0)
        })
        
        // Format bracket progression: "QF:W vs X, SF:W vs Y, F:W vs Z"
        const formatTime = (time) => {
          if (!time) return ''
          if (typeof time === 'number') return time.toFixed(2)
          return time
        }
        
        climber.bracket_history = history.map(m => {
          const timeStr = m.total_time ? ` (${formatTime(m.total_time)}s)` : ''
          return `${m.stage.substring(0, 2).toUpperCase()}:${m.result} vs ${m.opponent}${timeStr}`
        }).join(' | ') || '-'
        
        // Also add progression summary (stages reached)
        const stagesReached = [...new Set(history.map(m => m.stage))].sort((a, b) => {
          const priorityA = stagePriority[a] || 99
          const priorityB = stagePriority[b] || 99
          return priorityA - priorityB
        })
        climber.progression = stagesReached.join(' → ') || '-'
      })
      
      generateResultListExcel(resultList, { ...competition, type: 'speed' }, round, finals)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredQualification(qualification)
      setFilteredFinals(finals)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredQualification(
        qualification.filter(score =>
          score.name?.toLowerCase().includes(query) ||
          score.team?.toLowerCase().includes(query) ||
          score.bib_number?.toString().includes(query)
        )
      )
      setFilteredFinals(
        finals.filter(match =>
          match.climber_a_name?.toLowerCase().includes(query) ||
          match.climber_b_name?.toLowerCase().includes(query) ||
          match.climber_a_team?.toLowerCase().includes(query) ||
          match.climber_b_team?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, qualification, finals])

  const fetchCompetition = async (competitionId) => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}`)
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

  const fetchQualification = async (competitionId) => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/qualification`)
      if (response.ok) {
        const data = await response.json()
        setQualification(data)
        setFilteredQualification(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching qualification:', error)
      setLoading(false)
    }
  }

  const fetchFinals = async (competitionId) => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/finals`)
      if (response.ok) {
        const data = await response.json()
        setFinals(data)
        setFilteredFinals(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching finals:', error)
      setLoading(false)
    }
  }

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
                  Speed Climbing
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

        {/* Tabs - Modern Segmented Control */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="inline-flex bg-[#121212] border border-zinc-800 rounded-sm p-1 gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('qualification')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 font-bold transition-all duration-200 rounded-sm text-xs sm:text-sm uppercase tracking-wider ${
                activeTab === 'qualification'
                  ? 'bg-[#FFB800] shadow-lg text-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Qualification
            </button>
            <button
              onClick={() => setActiveTab('finals')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 font-bold transition-all duration-200 rounded-sm text-xs sm:text-sm uppercase tracking-wider ${
                activeTab === 'finals'
                  ? 'bg-[#FFB800] shadow-lg text-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Finals
            </button>
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
              <div>
                Showing <span className="text-zinc-300">{activeTab === 'qualification' ? filteredQualification.length : filteredFinals.length}</span> {activeTab === 'qualification' ? 'Athletes' : 'Matches'}
              </div>
            </div>
          </div>

          {/* Qualification Tab */}
          {activeTab === 'qualification' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                {filteredQualification.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-sm">
                    <div className="bg-[#121212] p-4 rounded-full mb-4">
                      <Users className="text-zinc-600" size={32} />
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
                  filteredQualification.map((score, index) => (
                    <div key={score.climber_id || index} className="transition-transform duration-200 hover:scale-[1.005]">
                      <QualificationCard score={score} index={index} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Finals Tab */}
          {activeTab === 'finals' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredFinals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-sm">
                  <div className="bg-[#121212] p-4 rounded-full mb-4">
                    <Trophy className="text-zinc-600" size={32} />
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
                <SpeedBracketView 
                  matches={filteredFinals} 
                  onMatchClick={(match) => {
                    setSelectedMatch(match)
                    setShowMatchDetail(true)
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Match Detail Modal */}
      <MatchDetailModal
        isOpen={showMatchDetail}
        onClose={() => {
          setShowMatchDetail(false)
          setSelectedMatch(null)
        }}
        match={selectedMatch}
      />
    </PublicLayout>
  )
}

export default SpeedScorePage
