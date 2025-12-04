import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function AthletesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const athletes = [
    {
      id: 1,
      name: 'Ahmad Rizki',
      category: 'Speed Climbing',
      achievement: 'Medali Emas Kejurnas 2024',
      age: 22,
      image: 'https://picsum.photos/seed/climbing1/800/600'
    },
    {
      id: 2,
      name: 'Siti Nurhaliza',
      category: 'Lead / Boulder',
      achievement: 'Juara 1 Kejurprov Jateng',
      age: 20,
      image: 'https://picsum.photos/seed/climbing2/800/600'
    },
    {
      id: 3,
      name: 'Budi Santoso',
      category: 'Boulder',
      achievement: 'Medali Perak Porprov 2024',
      age: 24,
      image: 'https://picsum.photos/seed/climbing3/800/600'
    },
    {
      id: 4,
      name: 'Rina Wati',
      category: 'Speed Climbing',
      achievement: 'Juara 3 Kejurnas 2024',
      age: 19,
      image: 'https://picsum.photos/seed/climbing4/800/600'
    },
    {
      id: 5,
      name: 'Dedi Kurniawan',
      category: 'Lead',
      achievement: 'Medali Emas Kejurda',
      age: 25,
      image: 'https://picsum.photos/seed/climbing5/800/600'
    },
    {
      id: 6,
      name: 'Maya Sari',
      category: 'Boulder',
      achievement: 'Juara 2 Kejurprov',
      age: 21,
      image: 'https://picsum.photos/seed/climbing6/800/600'
    }
  ]

  const categories = ['all', 'Speed Climbing', 'Lead / Boulder', 'Boulder', 'Lead']

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.achievement.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || athlete.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-rich-black min-h-screen text-off-white font-body">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.jpeg" 
              alt="FPTI Karanganyar" 
              className="w-10 h-10 rounded-full object-cover border-2 border-goldenrod/50"
            />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg tracking-wider">FPTI</span>
              <span className="text-[10px] text-goldenrod uppercase tracking-[0.2em]">Karanganyar</span>
            </div>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-goldenrod transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-gunmetal to-rich-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-4">Squad Kami</h3>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">Atlet Berprestasi</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Kenali para atlet yang mengharumkan nama FPTI Karanganyar di berbagai kompetisi
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter & Search */}
      <section className="py-8 bg-gunmetal border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari atlet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-rich-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-goldenrod"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-gray-400" size={20} />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === cat
                      ? 'bg-goldenrod text-black'
                      : 'bg-rich-black text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {cat === 'all' ? 'Semua' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Athletes Grid */}
      <section className="py-20 bg-rich-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAthletes.map((athlete, index) => (
              <motion.div
                key={athlete.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative h-[450px] rounded-xl overflow-hidden cursor-pointer bg-gunmetal"
              >
                <img 
                  src={athlete.image}
                  alt={athlete.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/800x600/E11D23/FFFFFF?text=${encodeURIComponent(athlete.name)}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-6">
                  <span className="bg-goldenrod text-black text-xs font-bold px-3 py-1 rounded mb-3 inline-block">
                    {athlete.category}
                  </span>
                  <h3 className="text-2xl font-heading font-bold text-white mb-2">{athlete.name}</h3>
                  <p className="text-gray-300 text-sm mb-2">Umur: {athlete.age} tahun</p>
                  <p className="text-goldenrod text-sm font-medium">
                    {athlete.achievement}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredAthletes.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Tidak ada atlet yang ditemukan</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10 text-center text-gray-500 text-sm bg-rich-black">
        <div className="container mx-auto px-6">
          <p>&copy; 2024 FPTI Karanganyar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default AthletesPage

