import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Users, Medal, GraduationCap, Trophy } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import './LandingPage.css' // Pastikan file ini ada atau hapus jika styling sudah full Tailwind

function AthletesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch('/api/athletes')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setAthletes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching athletes:', error)
        setAthletes([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    fetchAthletes()
  }, [])

  const categories = ['all', ...new Set((athletes || []).map(a => a?.category).filter(Boolean))]

  const filteredAthletes = (athletes || []).filter(athlete => {
    if (!athlete) return false
    
    const name = (athlete.name || '').toLowerCase()
    const achievement = (athlete.achievement || '').toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    const matchesSearch = name.includes(searchLower) || achievement.includes(searchLower)
    const matchesCategory = filterCategory === 'all' || athlete.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800] mb-4"></div>
            <div className="text-xl font-bold mb-2 text-[#FFB800] tracking-wider">LOADING DATA</div>
            <p className="text-zinc-500 text-sm tracking-widest uppercase">Please wait</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // --- MAIN RENDER ---

  return (
    <PublicLayout>
      <div className="bg-[#0a0a0a] min-h-screen text-zinc-200 font-sans selection:bg-[#FFB800] selection:text-black">
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 border-b border-zinc-800 bg-[#111111]">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1 bg-[#FFB800]"></div>
                <h3 className="text-[#FFB800] font-bold uppercase tracking-widest text-sm">Squad Kami</h3>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 text-white uppercase tracking-tight leading-none">
                Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-yellow-600">Athletes</span>
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                Mengenal lebih dekat para atlet yang mendedikasikan diri untuk mengharumkan nama FPTI Karanganyar di kancah nasional dan internasional.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Controls Section (Sticky) */}
        <section className="sticky top-16 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-800 py-6">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-[#FFB800] transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Cari atlet atau prestasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-zinc-800 rounded-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all text-sm font-medium"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <Filter className="text-zinc-500 mr-2 flex-shrink-0" size={18} />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                      filterCategory === cat
                        ? 'bg-[#FFB800] text-black border-[#FFB800]'
                        : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {cat === 'all' ? 'All Squad' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Athletes Grid */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            
            {filteredAthletes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-sm">
                <div className="bg-[#111111] p-6 rounded-full mb-6">
                  <Users className="text-zinc-600" size={48} />
                </div>
                <h3 className="text-xl font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Tidak ada atlet ditemukan
                </h3>
                <p className="text-zinc-500 max-w-md mb-6">
                  Coba ubah kata kunci pencarian atau kategori filter Anda.
                </p>
                <button
                  onClick={() => {setSearchTerm(''); setFilterCategory('all');}}
                  className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded transition-colors border border-zinc-800"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAthletes.map((athlete, index) => (
                  <motion.div
                    key={athlete?.id || `athlete-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="group relative h-[450px] bg-[#111111] border border-zinc-800 hover:border-[#FFB800] transition-colors duration-300 overflow-hidden"
                  >
                    {/* Image Area */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={
                          athlete?.image 
                            ? (athlete.image.startsWith('http') || athlete.image.startsWith('/') 
                                ? athlete.image 
                                : `/${athlete.image}`)
                            : `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23111111" width="800" height="600"/%3E%3Ctext fill="%23333333" font-family="Arial" font-weight="bold" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENO PHOTO%3C/text%3E%3C/svg%3E`
                        }
                        alt={athlete?.name || 'Athlete'}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out transform group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          const athleteName = athlete?.name || 'NO PHOTO'
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23111111" width="800" height="600"/%3E%3Ctext fill="%23333333" font-family="Arial" font-weight="bold" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(athleteName)}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                      {/* Dark Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500"></div>
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end">
                      {/* Top Badges */}
                      {athlete?.category && (
                        <div className="absolute top-4 left-4 flex flex-col gap-2 transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                          <span className="bg-[#FFB800] text-black text-[10px] font-black px-2 py-1 uppercase tracking-widest inline-block w-fit">
                            {athlete.category}
                          </span>
                        </div>
                      )}

                      {/* Main Info */}
                      <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-2xl font-black text-white uppercase leading-tight mb-2">
                          {athlete?.name || 'Unknown Athlete'}
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-zinc-400 text-sm border-b border-zinc-800 pb-2 mb-2">
                            <GraduationCap size={16} className="text-[#FFB800]" />
                            <span className="truncate">{athlete.school || 'FPTI Academy'}</span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                             <Trophy size={16} className="text-[#FFB800] mt-1 flex-shrink-0" />
                             <p className="text-zinc-300 text-sm font-medium leading-snug line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                               {athlete.achievement || 'Atlet Muda Berbakat'}
                             </p>
                          </div>
                        </div>

                        {/* Hover Action Line */}
                        <div className="w-0 group-hover:w-full h-1 bg-[#FFB800] mt-4 transition-all duration-500 ease-out"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-zinc-800 bg-[#111111] text-center">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Medal className="text-[#FFB800]" size={24} />
              <span className="text-xl font-bold text-white tracking-widest">FPTI KARANGANYAR</span>
            </div>
            <p className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} Official Athlete Roster. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </PublicLayout>
  )
}

export default AthletesPage