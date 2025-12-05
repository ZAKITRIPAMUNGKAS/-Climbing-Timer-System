import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import './LandingPage.css'

function NewsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news')
        const data = await response.json()
        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const categories = ['all', ...new Set(news.map(n => n.category).filter(Boolean))]

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <PublicLayout>
      <div className="bg-rich-black min-h-screen text-off-white font-body">
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
            {loading ? (
              <div className="col-span-3 text-center text-gray-400 py-10">Memuat data...</div>
            ) : filteredNews.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400 py-10">Tidak ada berita yang ditemukan</div>
            ) : (
              filteredNews.map((article, index) => (
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
                    src={article.image && article.image.startsWith('http') ? article.image : (article.image ? article.image : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E')}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback ke SVG placeholder jika gambar gagal load
                      e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(article.category || 'News')}%3C/text%3E%3C/svg%3E`;
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
                  <div className="text-gray-400 text-sm leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ 
                    __html: article.description ? article.description.substring(0, 150) + '...' : 'Tidak ada deskripsi'
                  }}></div>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

        {/* Footer */}
        <footer className="py-10 border-t border-white/10 text-center text-gray-500 text-sm bg-rich-black">
          <div className="container mx-auto px-6">
            <p>&copy; 2024 FPTI Karanganyar. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PublicLayout>
  )
}

export default NewsPage

