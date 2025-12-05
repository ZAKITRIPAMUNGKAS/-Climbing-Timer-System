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

    // Initialize socket connection
    socketRef.current = io()

    // Listen for score updates
    socketRef.current.on('score-updated', (data) => {
      console.log('Score updated:', data)
      // Refresh leaderboard when score is updated
      if (competition && data.competition_id === competition.id) {
        fetchLeaderboard(competition.id)
      }
    })

    // Fetch competition by ID
    fetchCompetition(parseInt(competitionId))

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
      const response = await fetch(`/api/competitions/${compId}/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
        setFilteredLeaderboard(data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
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
      <div className="min-h-screen bg-rich-black text-off-white font-body pt-24 md:pt-20">
        {/* Header */}
        <div className="bg-gunmetal border-b border-white/10 py-8">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-goldenrod tracking-tight">
                  Live Score Boulder
                </h1>
                <div className="flex items-center gap-2">
                  <Trophy className="text-gray-400" size={18} />
                  <p className="text-lg text-gray-300 font-medium">{competition.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Big Screen Button */}
                <Link
                  to={`/big-screen/${competition.id}`}
                  target="_blank"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg"
                  title="Open Big Screen Mode (Videotron View)"
                >
                  <Monitor size={18} />
                  <span className="hidden sm:inline">Big Screen</span>
                </Link>
                {/* PDF Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportStartList}
                    className="px-4 py-2 bg-goldenrod text-rich-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-lg"
                    title="Export Start List PDF"
                  >
                    <FileText size={18} />
                    <span className="hidden sm:inline">Start List</span>
                  </button>
                  <button
                    onClick={handleExportResultList}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
                    title="Export Result List PDF"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Results</span>
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Status</div>
                  <div className={`text-xl font-bold flex items-center gap-2 ${
                    competition.status === 'active' ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      competition.status === 'active' ? 'bg-green-400' : 'bg-gray-500'
                    }`}></div>
                    {competition.status === 'active' ? 'Aktif' : 'Selesai'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <main className="container mx-auto px-6 py-8">
          {/* Search Bar - Clean Design */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari atlet berdasarkan nama, tim, atau nomor bib..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gunmetal border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-goldenrod/50 focus:border-goldenrod text-base text-white placeholder-gray-400 shadow-lg transition-all"
              />
            </div>
            {searchQuery && (
              <div className="mt-3 text-center text-sm text-gray-400">
                Menampilkan <span className="text-goldenrod font-semibold">{filteredLeaderboard.length}</span> dari <span className="text-white font-semibold">{leaderboard.length}</span> atlet
              </div>
            )}
          </div>

          {/* Leaderboard Container - Clean & Modern */}
          <div className="bg-gunmetal rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Header - Simplified */}
            <div className="bg-gradient-to-r from-rich-black to-gunmetal border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-goldenrod" size={22} />
                  <h2 className="text-lg font-bold text-white">Leaderboard</h2>
                </div>
                <div className="text-sm text-gray-400">
                  {leaderboard.length} Atlet
                </div>
              </div>
            </div>

            {/* Leaderboard Cards - Cleaner Spacing */}
            <div className="p-6 space-y-4">
              {filteredLeaderboard.length === 0 ? (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <Target className="text-gray-400" size={56} />
                    <div className="text-gray-400 text-xl font-semibold">
                      {searchQuery ? 'Tidak ada atlet yang sesuai dengan pencarian' : 'Belum ada data atlet'}
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 px-4 py-2 text-sm text-goldenrod hover:text-yellow-400 transition-colors"
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
        <div className="mt-10 bg-gunmetal rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-goldenrod" size={24} />
            <h3 className="text-xl font-bold text-white">Sistem Poin Kejurnas FPTI</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
