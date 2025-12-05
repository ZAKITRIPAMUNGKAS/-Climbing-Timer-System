import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Timer, TrendingUp } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'

function LiveScoreSelectorPage() {
  const [boulderCompetitions, setBoulderCompetitions] = useState([])
  const [speedCompetitions, setSpeedCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const [boulderRes, speedRes] = await Promise.all([
        fetch('/api/competitions'),
        fetch('/api/speed-competitions')
      ])
      
      if (boulderRes.ok) {
        const data = await boulderRes.json()
        setBoulderCompetitions(data.filter(c => c.status === 'active'))
      }
      
      if (speedRes.ok) {
        const data = await speedRes.json()
        setSpeedCompetitions(data.filter(c => c.status !== 'finished'))
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setLoading(false)
    }
  }

  const handleBoulderClick = (competitionId) => {
    navigate(`/live-score?competition=${competitionId}`)
  }

  const handleSpeedClick = (competitionId, round) => {
    navigate(`/speed-score?competition=${competitionId}&round=${round}`)
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

  const allCompetitions = [
    ...boulderCompetitions.map(c => ({ ...c, type: 'boulder' })),
    ...speedCompetitions.map(c => ({ ...c, type: 'speed' }))
  ]

  return (
    <PublicLayout>
      <div className="min-h-screen bg-rich-black text-off-white font-body pt-24 md:pt-20">
        {/* Header */}
        <div className="bg-gunmetal border-b border-white/10 py-12">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-4 mb-2">
              <TrendingUp className="text-goldenrod" size={40} />
              <h1 className="text-4xl md:text-5xl font-bold text-goldenrod tracking-tight">
                Live Score
              </h1>
            </div>
            <p className="text-gray-400 text-lg">Pilih kompetisi untuk melihat skor langsung</p>
          </div>
        </div>

        {/* Competitions Grid */}
        <main className="container mx-auto px-6 py-12">
          {allCompetitions.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gunmetal rounded-2xl p-12 border border-white/10 max-w-md mx-auto">
                <Trophy className="mx-auto mb-4 text-gray-500" size={64} />
                <h3 className="text-2xl font-bold text-white mb-2">Tidak ada kompetisi aktif</h3>
                <p className="text-gray-400">Belum ada kompetisi yang sedang berlangsung</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Boulder Competitions */}
              {boulderCompetitions.map((comp) => (
                <div
                  key={`boulder-${comp.id}`}
                  onClick={() => handleBoulderClick(comp.id)}
                  className="group bg-gunmetal rounded-2xl p-6 border border-white/10 hover:border-goldenrod/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(255,193,7,0.2)] hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-goldenrod/20 rounded-xl group-hover:bg-goldenrod/30 transition-colors">
                      <Trophy className="text-goldenrod" size={32} />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      comp.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {comp.status === 'active' ? 'Aktif' : 'Selesai'}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-goldenrod transition-colors">
                    {comp.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">Boulder Competition</p>
                  <div className="flex items-center gap-2 text-goldenrod font-semibold">
                    <span>Lihat Score</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}

              {/* Speed Competitions */}
              {speedCompetitions.map((comp) => {
                // Tampilkan card berdasarkan status competition
                const isQualification = comp.status === 'qualification'
                const isFinals = comp.status === 'finals'
                
                return (
                  <div
                    key={`speed-${comp.id}-${comp.status}`}
                    onClick={() => handleSpeedClick(comp.id, comp.status)}
                    className="group bg-gunmetal rounded-2xl p-6 border border-white/10 hover:border-goldenrod/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(255,193,7,0.2)] hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-goldenrod/20 rounded-xl group-hover:bg-goldenrod/30 transition-colors">
                        <Timer className="text-goldenrod" size={32} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isQualification 
                          ? 'bg-green-500/20 text-green-400'
                          : isFinals
                          ? 'bg-crimson/20 text-crimson'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {isQualification ? 'Kualifikasi' : isFinals ? 'Final' : 'Selesai'}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-goldenrod transition-colors">
                      {comp.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Speed Climbing - {isQualification ? 'Kualifikasi' : isFinals ? 'Final' : 'Selesai'}
                    </p>
                    <div className="flex items-center gap-2 text-goldenrod font-semibold">
                      <span>Lihat Score</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </PublicLayout>
  )
}

export default LiveScoreSelectorPage

