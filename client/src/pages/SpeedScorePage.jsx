import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Timer, Users, Search, FileText, Download, Monitor } from 'lucide-react'
import QualificationCard from '../components/QualificationCard'
import MatchVersusCard from '../components/MatchVersusCard'
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
      // For finals, we need to create a result list from matches
      // Convert matches to a format that shows both climbers
      const resultList = finals.flatMap((match) => {
        const results = []
        
        // Add climber A
        if (match.climber_a_name) {
          results.push({
            rank: match.climber_a_rank || '-',
            bib_number: match.climber_a_bib || '-',
            name: match.climber_a_name || '-',
            team: match.climber_a_team || '-',
            lane_a_time: match.time_a,
            lane_b_time: null,
            total_time: match.time_a ? parseFloat(match.time_a) : null,
            status: match.status_a || 'VALID',
            stage: match.stage,
            match_order: match.match_order
          })
        }
        
        // Add climber B if exists
        if (match.climber_b_name) {
          results.push({
            rank: match.climber_b_rank || '-',
            bib_number: match.climber_b_bib || '-',
            name: match.climber_b_name || '-',
            team: match.climber_b_team || '-',
            lane_a_time: null,
            lane_b_time: match.time_b,
            total_time: match.time_b ? parseFloat(match.time_b) : null,
            status: match.status_b || 'VALID',
            stage: match.stage,
            match_order: match.match_order
          })
        }
        
        return results
      })
      
      generateResultListExcel(resultList, { ...competition, type: 'speed' }, round)
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
        <div className="min-h-screen bg-rich-black text-off-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-goldenrod mb-4"></div>
            <div className="text-xl font-semibold mb-2 text-goldenrod">Memuat data...</div>
            <p className="text-gray-400">Mohon tunggu sebentar</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!competition) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-rich-black text-off-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-gunmetal rounded-xl p-8 shadow-2xl border border-white/10">
              <Trophy className="mx-auto mb-4 text-gray-400" size={48} />
              <div className="text-2xl font-semibold mb-4 text-white">Tidak ada kompetisi aktif</div>
              <p className="text-gray-400 mb-6">Silakan hubungi administrator untuk membuat kompetisi.</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-crimson text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft size={18} />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-rich-black text-off-white font-body pt-20 sm:pt-24 md:pt-20 pb-8 overflow-x-hidden">
        {/* Header */}
        <div className="bg-gunmetal border-b border-white/10 py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-goldenrod tracking-tight break-words">
                  Speed Climbing (Classic)
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Timer className="text-gray-400 flex-shrink-0" size={18} />
                  <p className="text-base sm:text-lg text-gray-300 font-medium break-words">{competition.name}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
                {/* Big Screen Button */}
                <Link
                  to={`/big-screen/${competition.id}`}
                  target="_blank"
                  className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg text-sm sm:text-base"
                  title="Open Big Screen Mode (Videotron View)"
                >
                  <Monitor size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Big Screen</span>
                </Link>
                {/* PDF Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportStartList}
                    className="px-3 sm:px-4 py-2 bg-goldenrod text-rich-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-lg text-sm sm:text-base"
                    title="Export Start List PDF"
                  >
                    <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">Start List</span>
                  </button>
                  <button
                    onClick={handleExportResultList}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg text-sm sm:text-base"
                    title="Export Result List PDF"
                  >
                    <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">Results</span>
                  </button>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Status</div>
                  <div className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
                    competition.status === 'finished' ? 'text-gray-500' : 'text-green-400'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      competition.status === 'finished' ? 'bg-gray-500' : 'bg-green-400'
                    }`}></div>
                    <span className="whitespace-nowrap">{competition.status === 'qualification' ? 'Kualifikasi' : 
                     competition.status === 'finals' ? 'Final' : 'Selesai'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Tabs - Modern Segmented Control */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="inline-flex bg-rich-black border border-white/10 rounded-lg p-1 gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('qualification')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 font-semibold transition-all duration-200 rounded-md text-sm sm:text-base ${
              activeTab === 'qualification'
                ? 'bg-goldenrod shadow-lg text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Kualifikasi
          </button>
          <button
            onClick={() => setActiveTab('finals')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 font-semibold transition-all duration-200 rounded-md text-sm sm:text-base ${
              activeTab === 'finals'
                ? 'bg-goldenrod shadow-lg text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Final
          </button>
        </div>
      </div>

        {/* Content */}
        <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-12 max-w-full overflow-x-hidden">
          {/* Search Bar - Clean Design */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari atlet berdasarkan nama atau tim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gunmetal border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-goldenrod/50 focus:border-goldenrod text-sm sm:text-base text-white placeholder-gray-400 shadow-lg transition-all"
              />
            </div>
            {searchQuery && (
              <div className="mt-3 text-center text-xs sm:text-sm text-gray-400">
                Menampilkan <span className="text-goldenrod font-semibold">{activeTab === 'qualification' ? filteredQualification.length : filteredFinals.length}</span> dari <span className="text-white font-semibold">{activeTab === 'qualification' ? qualification.length : finals.length}</span> {activeTab === 'qualification' ? 'atlet' : 'match'}
              </div>
            )}
          </div>

          {/* Qualification Tab */}
          {activeTab === 'qualification' && (
            <div className="bg-gunmetal rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="bg-rich-black border-b border-white/10 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Users className="text-goldenrod flex-shrink-0" size={18} />
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Kualifikasi</h2>
                </div>
              </div>

              <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                {filteredQualification.length === 0 ? (
                  <div className="text-center py-12 sm:py-20">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="text-gray-400" size={48} />
                      <div className="text-gray-400 text-base sm:text-lg lg:text-xl font-semibold px-4">
                        {searchQuery ? 'Tidak ada atlet yang sesuai dengan pencarian' : 'Belum ada data kualifikasi'}
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 px-4 py-2 text-sm bg-white/20 text-white hover:bg-white/30 transition-colors rounded-lg"
                        >
                          Hapus pencarian
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredQualification.map((score, index) => (
                    <QualificationCard key={score.climber_id || index} score={score} index={index} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Finals Tab */}
          {activeTab === 'finals' && (
            <div className="bg-gunmetal rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="bg-gradient-to-r from-rich-black to-gunmetal border-b border-white/10 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Trophy className="text-goldenrod flex-shrink-0" size={18} />
                    <h2 className="text-base sm:text-lg font-bold text-white">Final</h2>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {finals.length} Match
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                {filteredFinals.length === 0 ? (
                  <div className="text-center py-12 sm:py-20">
                    <div className="flex flex-col items-center gap-4">
                      <Trophy className="text-gray-400" size={48} />
                      <div className="text-gray-400 text-base sm:text-lg lg:text-xl font-semibold px-4">
                        {searchQuery ? 'Tidak ada match yang sesuai dengan pencarian' : 'Belum ada data final'}
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 px-4 py-2 text-sm bg-white/20 text-white hover:bg-white/30 transition-colors rounded-lg"
                        >
                          Hapus pencarian
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredFinals.map((match) => (
                    <MatchVersusCard key={match.id} match={match} />
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </PublicLayout>
  )
}

export default SpeedScorePage
