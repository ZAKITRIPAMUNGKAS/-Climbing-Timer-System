import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, TrendingUp, Award, Target, Info, Search, FileText, Download, Monitor } from 'lucide-react'
import LeaderboardCard from '../components/LeaderboardCard'
import PublicLayout from '../components/PublicLayout'
import { generateStartListPDF, generateResultListPDF } from '../utils/pdfExport'

function LiveScorePage() {
  const [competition, setCompetition] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([])
  const [climbers, setClimbers] = useState([]) // For Start List PDF
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false) // Indicator for real-time updates
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
      alert('No climbers available for Start List')
      return
    }
    generateStartListPDF(climbers, competition, 'Qualification')
  }

  const handleExportResultList = () => {
    if (leaderboard.length === 0) {
      alert('No results available for Result List')
      return
    }
    generateResultListPDF(leaderboard, competition, 'Qualification')
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
      <div className="min-h-screen bg-rich-black text-off-white font-body pt-20 sm:pt-24 md:pt-20 pb-8">
        {/* Header */}
        <div className="bg-gunmetal border-b border-white/10 py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-goldenrod tracking-tight break-words">
                  Live Score Boulder
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Trophy className="text-gray-400 flex-shrink-0" size={18} />
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
                  <Monitor size={16} className="sm:w-4 sm:h-4" />
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
                    competition.status === 'active' ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      competition.status === 'active' ? 'bg-green-400' : 'bg-gray-500'
                    }`}></div>
                    <span className="whitespace-nowrap">{competition.status === 'active' ? 'Aktif' : 'Selesai'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Search Bar - Clean Design */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari atlet berdasarkan nama, tim, atau nomor bib..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gunmetal border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-goldenrod/50 focus:border-goldenrod text-sm sm:text-base text-white placeholder-gray-400 shadow-lg transition-all"
              />
            </div>
            {searchQuery && (
              <div className="mt-3 text-center text-sm text-gray-400">
                Menampilkan <span className="text-goldenrod font-semibold">{filteredLeaderboard.length}</span> dari <span className="text-white font-semibold">{leaderboard.length}</span> atlet
              </div>
            )}
          </div>

        {/* Leaderboard Container - New Design */}
        <div className="bg-rich-black rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="bg-rich-black border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-orange-500" size={18} />
                <h2 className="text-base sm:text-lg font-bold text-white">Leaderboard</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-white">{leaderboard.length} Atlet</span>
                {isUpdating && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] sm:text-xs text-green-400 font-bold">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard - Single Column Vertical Layout */}
          <div className="p-3 sm:p-4 lg:p-6 space-y-0 overflow-x-auto">
            {filteredLeaderboard.length === 0 ? (
              <div className="text-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Target className="text-white/60" size={56} />
                  <div className="text-white/80 text-xl font-semibold">
                    {searchQuery ? 'Tidak ada atlet yang sesuai dengan pencarian' : 'Belum ada data atlet'}
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
              filteredLeaderboard.map((climber, index) => (
                <LeaderboardCard key={climber.id} climber={climber} index={index} />
              ))
            )}
          </div>
        </div>

        {/* Info Box - Cleaner Design */}
        <div className="mt-6 sm:mt-10 bg-gunmetal rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Info className="text-goldenrod flex-shrink-0" size={20} />
            <h3 className="text-lg sm:text-xl font-bold text-white break-words">Sistem Poin Kejurnas FPTI</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-rich-black rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-goldenrod" size={20} />
                <p className="font-bold text-base text-white">Rumus Poin:</p>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-goldenrod font-bold text-lg">●</span>
                  <div>
                    <span className="text-goldenrod font-bold">TOP:</span> 25.0 - ((attempts - 1) × 0.1)
                    <div className="text-sm text-gray-400 mt-1">Contoh: 1 attempt = 25.0, 2 attempts = 24.9</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 font-bold text-lg">●</span>
                  <div>
                    <span className="text-gray-300 font-bold">ZONE (No Top):</span> 10.0 - ((attempts - 1) × 0.1)
                    <div className="text-sm text-gray-400 mt-1">Contoh: 1 attempt = 10.0, 2 attempts = 9.9</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 font-bold text-lg">●</span>
                  <div>
                    <span className="text-gray-400 font-semibold">FAIL:</span> 0.0 poin
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-rich-black rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Target className="text-gray-400" size={20} />
                <p className="font-bold text-base text-white">Keterangan:</p>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-goldenrod font-bold text-lg">●</span>
                  <span>Jika mencapai <span className="text-goldenrod font-bold">TOP</span>, poin ZONE diabaikan</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 font-bold text-lg">●</span>
                  <span>Poin dikurangi <span className="text-gray-300 font-bold">0.1</span> per attempt tambahan</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 font-bold text-lg">●</span>
                  <span>Ranking berdasarkan <span className="text-green-400 font-semibold">Total Poin</span> (tertinggi)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 font-bold text-lg">●</span>
                  <span>Kotak hitam = Berhasil mencapai TOP/ZONE</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      </div>
    </PublicLayout>
  )
}

export default LiveScorePage
