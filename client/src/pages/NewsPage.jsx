import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function NewsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const news = [
    { 
      id: 1,
      category: 'Kompetisi', 
      color: 'crimson',
      title: 'Kejurkab Karanganyar 2024 Sukses Digelar',
      description: 'Kompetisi panjat tebing tingkat kabupaten berhasil diselenggarakan dengan antusiasme tinggi dari peserta. Total 150 atlet dari berbagai klub mengikuti kompetisi ini.',
      date: '10 Desember 2024',
      image: 'https://picsum.photos/seed/news1/800/600'
    },
    { 
      id: 2,
      category: 'Latihan', 
      color: 'goldenrod',
      title: 'Program Latihan Intensif untuk Atlet Muda',
      description: 'FPTI Karanganyar meluncurkan program latihan khusus untuk mengembangkan bakat atlet muda. Program ini akan berlangsung selama 3 bulan dengan pelatih berpengalaman.',
      date: '5 Desember 2024',
      image: 'https://picsum.photos/seed/news2/800/600'
    },
    { 
      id: 3,
      category: 'Prestasi', 
      color: 'crimson',
      title: 'Atlet FPTI Raih Medali di Kejurprov',
      description: 'Prestasi membanggakan diraih oleh atlet FPTI Karanganyar dalam kejuaraan provinsi Jawa Tengah. Total 5 medali berhasil dibawa pulang.',
      date: '28 November 2024',
      image: 'https://picsum.photos/seed/news3/800/600'
    },
    { 
      id: 4,
      category: 'Kompetisi', 
      color: 'crimson',
      title: 'Pendaftaran Kejurnas 2025 Dibuka',
      description: 'Pendaftaran untuk Kejuaraan Nasional 2025 sudah dibuka. Segera daftarkan atlet Anda sebelum kuota penuh.',
      date: '20 November 2024',
      image: 'https://picsum.photos/seed/news4/800/600'
    },
    { 
      id: 5,
      category: 'Latihan', 
      color: 'goldenrod',
      title: 'Workshop Teknik Panjat Tebing untuk Pemula',
      description: 'Workshop khusus untuk pemula akan diadakan akhir bulan ini. Daftar segera karena terbatas untuk 30 peserta.',
      date: '15 November 2024',
      image: 'https://picsum.photos/seed/news5/800/600'
    },
    { 
      id: 6,
      category: 'Prestasi', 
      color: 'crimson',
      title: 'Atlet FPTI Lolos ke Kejurnas',
      description: 'Tiga atlet FPTI Karanganyar berhasil lolos ke Kejuaraan Nasional setelah menjuarai kompetisi tingkat provinsi.',
      date: '1 November 2024',
      image: 'https://picsum.photos/seed/news6/800/600'
    }
  ]

  const categories = ['all', 'Kompetisi', 'Latihan', 'Prestasi']

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory
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
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-4">Update</h3>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">Berita & Artikel</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Ikuti berita terbaru dan update dari FPTI Karanganyar
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
                placeholder="Cari berita..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-rich-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-goldenrod"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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

      {/* News Grid */}
      <section className="py-20 bg-rich-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-gunmetal rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer group"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/800x600/E11D23/FFFFFF?text=${encodeURIComponent(article.category)}`;
                    }}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-block px-3 py-1 ${
                      article.color === 'crimson' 
                        ? 'bg-crimson/20 text-crimson' 
                        : 'bg-goldenrod/20 text-goldenrod'
                    } text-xs rounded-full font-bold`}>
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {article.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3 text-white group-hover:text-goldenrod transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Tidak ada berita yang ditemukan</p>
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

export default NewsPage

