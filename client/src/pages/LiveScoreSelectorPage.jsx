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

  const allCompetitions = [
    ...boulderCompetitions.map(c => ({ ...c, type: 'boulder' })),
    ...speedCompetitions.map(c => ({ ...c, type: 'speed' }))
  ]

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans pt-20 sm:pt-24 md:pt-20 pb-12 overflow-x-hidden selection:bg-[#FFB800] selection:text-black">
        {/* Header Section */}
        <div className="bg-[#121212] border-b border-zinc-800 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase">
                Live Scoring
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-zinc-100 tracking-tighter uppercase leading-none">
              Live Score
              <span className="text-[#FFB800]">.</span>
            </h1>
            <p className="text-zinc-400 font-mono text-sm mt-2 uppercase tracking-wider">Select Competition</p>
          </div>
        </div>

        {/* Competitions Grid */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
          {allCompetitions.length === 0 ? (
            <div className="text-center py-24">
              <div className="bg-[#121212] rounded-sm p-10 border border-zinc-800 max-w-md mx-auto">
                <Trophy className="mx-auto mb-6 text-zinc-600" size={64} />
                <h3 className="text-2xl font-bold text-zinc-100 mb-2 uppercase tracking-wider">No Active Competition</h3>
                <p className="text-zinc-500">No competitions are currently running</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Boulder Competitions */}
              {boulderCompetitions.map((comp) => (
                <div
                  key={`boulder-${comp.id}`}
                  onClick={() => handleBoulderClick(comp.id)}
                  className="group bg-[#121212] rounded-sm p-6 border border-zinc-800 hover:border-[#FFB800]/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#FFB800]/10 rounded-sm group-hover:bg-[#FFB800]/20 transition-colors">
                      <Trophy className="text-[#FFB800]" size={32} />
                    </div>
                    <div className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                      comp.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}>
                      {comp.status === 'active' ? 'Active' : 'Finished'}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-[#FFB800] transition-colors">
                    {comp.name}
                  </h3>
                  <p className="text-zinc-500 text-sm mb-4 uppercase tracking-wider">Boulder Competition</p>
                  <div className="flex items-center gap-2 text-[#FFB800] font-bold text-sm uppercase tracking-wider">
                    <span>View Score</span>
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
                    className="group bg-[#121212] rounded-sm p-6 border border-zinc-800 hover:border-[#FFB800]/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#FFB800]/10 rounded-sm group-hover:bg-[#FFB800]/20 transition-colors">
                        <Timer className="text-[#FFB800]" size={32} />
                      </div>
                      <div className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                        isQualification 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : isFinals
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {isQualification ? 'Qualification' : isFinals ? 'Finals' : 'Finished'}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-[#FFB800] transition-colors">
                      {comp.name}
                    </h3>
                    <p className="text-zinc-500 text-sm mb-4 uppercase tracking-wider">
                      Speed Climbing - {isQualification ? 'Qualification' : isFinals ? 'Finals' : 'Finished'}
                    </p>
                    <div className="flex items-center gap-2 text-[#FFB800] font-bold text-sm uppercase tracking-wider">
                      <span>View Score</span>
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

