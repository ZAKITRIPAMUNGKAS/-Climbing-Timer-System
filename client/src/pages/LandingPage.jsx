import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, Calendar, Users, Newspaper, Trophy, MapPin, Mail, Phone, Instagram, Facebook } from 'lucide-react'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [news, setNews] = useState([])
  const [nextEvent, setNextEvent] = useState(null)
  const [daysUntil, setDaysUntil] = useState(null)
  const [loading, setLoading] = useState(true)

  // Helper function to parse Indonesian date
  const parseIndonesianDate = (dateStr) => {
    if (!dateStr) return null
    
    const monthMap = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    }
    
    // Try to parse format like "15 Desember 2024"
    const parts = dateStr.toLowerCase().trim().split(/\s+/)
    if (parts.length >= 3) {
      const day = parseInt(parts[0])
      const monthName = parts[1]
      const year = parseInt(parts[2])
      
      if (monthMap[monthName] !== undefined && !isNaN(day) && !isNaN(year)) {
        const date = new Date(year, monthMap[monthName], day)
        // Validate the date
        if (date.getDate() === day && date.getMonth() === monthMap[monthName] && date.getFullYear() === year) {
          return date
        }
      }
    }
    
    // Try ISO format (YYYY-MM-DD)
    const isoDate = new Date(dateStr)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }
    
    return null
  }

  // Helper function to calculate days until event
  const calculateDaysUntil = (eventDate) => {
    if (!eventDate) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)
    
    const diffTime = eventDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays >= 0 ? diffDays : null
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [athletesRes, schedulesRes, newsRes] = await Promise.all([
          fetch('/api/athletes'),
          fetch('/api/schedules'),
          fetch('/api/news')
        ])
        const athletesData = await athletesRes.json()
        const schedulesData = await schedulesRes.json()
        const newsData = await newsRes.json()
        
        setAthletes(athletesData.slice(0, 3)) // Ambil 3 pertama untuk preview
        setSchedules(schedulesData.slice(0, 3)) // Ambil 3 pertama untuk preview
        setNews(newsData.slice(0, 3)) // Ambil 3 pertama untuk preview
        
        // Find next upcoming event
        const upcomingEvents = schedulesData.filter(e => e.status === 'upcoming')
        if (upcomingEvents.length > 0) {
          // Sort by date to get the nearest one
          const sortedEvents = upcomingEvents.sort((a, b) => {
            const dateA = parseIndonesianDate(a.date)
            const dateB = parseIndonesianDate(b.date)
            if (!dateA) return 1
            if (!dateB) return -1
            return dateA - dateB
          })
          
          const nearestEvent = sortedEvents[0]
          const eventDate = parseIndonesianDate(nearestEvent.date)
          const days = calculateDaysUntil(eventDate)
          
          setNextEvent(nearestEvent)
          setDaysUntil(days)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="bg-rich-black min-h-screen text-off-white font-body selection:bg-crimson selection:text-white">
      {/* --- HERO SECTION --- */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/beranda.jpeg')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-rich-black via-rich-black/70 to-transparent"></div>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left pt-24 sm:pt-28 md:pt-32 pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-goldenrod font-bold tracking-[0.2em] text-xs sm:text-sm mb-3 sm:mb-4 uppercase">Federasi Panjat Tebing Indonesia</h2>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-tight mb-4 sm:mb-6">
              Raih Puncak <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                Tanpa Batas
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto md:mx-0 mb-8 sm:mb-10 leading-relaxed px-4 sm:px-0">
              Wadah resmi pengembangan atlet panjat tebing di Kabupaten Karanganyar. 
              Membentuk karakter tangguh, disiplin, dan berprestasi.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start px-4 sm:px-0">
              <Link 
                to="/jadwal"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-crimson text-white font-bold rounded hover:bg-red-700 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base"
              >
                Lihat Jadwal Lomba
                <ChevronRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/atlet"
                className="px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white font-bold rounded hover:bg-white/10 transition-all backdrop-blur-sm text-sm sm:text-base"
              >
                Profil Atlet
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats Card */}
        {nextEvent && daysUntil !== null && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="hidden lg:block absolute bottom-10 lg:bottom-20 right-4 lg:right-20 bg-white/5 backdrop-blur-xl border border-white/10 p-4 lg:p-6 rounded-2xl w-56 lg:w-64 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
              <div className="bg-goldenrod p-2 rounded-lg text-black">
                <Calendar size={20}/>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Event Selanjutnya</p>
                <p className="font-bold text-sm line-clamp-2">{nextEvent.title}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-3xl font-bold text-crimson">{daysUntil}</div>
              <div className="text-sm text-gray-400 mb-1">
                {daysUntil === 0 ? 'Hari ini' : daysUntil === 1 ? 'Hari lagi' : 'Hari lagi'}
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* --- TENTANG SECTION --- */}
      <section id="about" className="py-12 sm:py-16 md:py-20 bg-gunmetal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="flex justify-center mb-4 sm:mb-6">
              <img 
                src="/logo.jpeg" 
                alt="FPTI Karanganyar" 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-goldenrod/50 shadow-[0_0_30px_rgba(255,193,7,0.3)]"
              />
            </div>
            <h3 className="text-crimson font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Tentang Kami</h3>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-4 sm:mb-6">FPTI Karanganyar</h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 px-4 sm:px-0">
              FPTI Karanganyar adalah komunitas panjat tebing yang berdedikasi untuk mengembangkan 
              olahraga panjat tebing di wilayah Karanganyar dan sekitarnya. Kami menyediakan fasilitas, 
              pelatihan, dan sistem timer profesional untuk mendukung kegiatan kompetisi dan latihan panjat tebing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-crimson mb-2">50+</div>
                <div className="text-gray-400">Atlet Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-goldenrod mb-2">20+</div>
                <div className="text-gray-400">Kejuaraan</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-crimson mb-2">10+</div>
                <div className="text-gray-400">Tahun Pengalaman</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- ATLET SECTION --- */}
      <section id="athletes" className="py-12 sm:py-16 md:py-20 bg-rich-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-12">
            <div>
              <h3 className="text-crimson font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Squad Kami</h3>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold">Atlet Berprestasi</h2>
            </div>
            <Link 
              to="/atlet"
              className="text-sm border-b border-goldenrod text-goldenrod pb-1 hover:text-white hover:border-white transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              <div className="col-span-3 text-center text-gray-400 py-10">Memuat data...</div>
            ) : athletes.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400 py-10">Belum ada data atlet</div>
            ) : (
              athletes.map((athlete, index) => (
              <motion.div
                key={athlete.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative h-[300px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden cursor-pointer"
              >
                <img 
                  src={athlete.image && athlete.image.startsWith('http') ? athlete.image : (athlete.image ? athlete.image : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E')}
                  alt={athlete.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback ke SVG placeholder jika gambar gagal load
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(athlete.name)}%3C/text%3E%3C/svg%3E`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="bg-goldenrod text-black text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                    {athlete.category}
                  </span>
                  <h3 className="text-2xl font-heading font-bold text-white mb-1">{athlete.name}</h3>
                  <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {athlete.achievement || 'Tidak ada prestasi'}
                  </p>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- JADWAL SECTION --- */}
      <section id="schedule" className="py-12 sm:py-16 md:py-20 bg-gunmetal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-crimson font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Kalender</h3>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">Jadwal Lomba</h2>
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-0">
            {loading ? (
              <div className="text-center text-gray-400 py-10">Memuat data...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center text-gray-400 py-10">Belum ada data jadwal</div>
            ) : (
              schedules.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className={`flex gap-6 mb-8 ${event.status === 'past' ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${event.status === 'upcoming' ? 'bg-goldenrod shadow-[0_0_20px_rgba(255,193,7,0.5)]' : 'bg-gray-600'}`}></div>
                  {index < 2 && <div className="w-[2px] h-20 bg-gray-700 mt-2"></div>}
                </div>
                <div className="flex-1 pb-8 border-b border-gray-800">
                  <div className="text-goldenrod text-sm font-bold mb-1">{event.date}</div>
                  <h3 className="text-xl font-heading font-bold mb-2">{event.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{event.location}</p>
                  {event.status === 'upcoming' && (
                    <span className="inline-block px-3 py-1 bg-crimson/20 text-crimson text-xs rounded-full">
                      Akan Datang
                    </span>
                  )}
                  {event.status === 'past' && (
                    <span className="inline-block px-3 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                      Selesai
                    </span>
                  )}
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- BERITA SECTION --- */}
      <section id="news" className="py-12 sm:py-16 md:py-20 bg-rich-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-12">
            <div>
              <h3 className="text-crimson font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Update</h3>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold">Berita & Artikel</h2>
            </div>
            <Link 
              to="/berita"
              className="text-sm border-b border-goldenrod text-goldenrod pb-1 hover:text-white hover:border-white transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              <div className="col-span-3 text-center text-gray-400 py-10">Memuat data...</div>
            ) : news.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400 py-10">Belum ada data berita</div>
            ) : (
              news.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                onClick={() => navigate(`/berita/${article.id}`)}
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
                  <span className={`inline-block px-3 py-1 ${
                    article.color === 'crimson' 
                      ? 'bg-crimson/20 text-crimson' 
                      : 'bg-goldenrod/20 text-goldenrod'
                  } text-xs rounded-full mb-3 font-bold`}>
                    {article.category}
                  </span>
                  <h3 className="text-xl font-heading font-bold mb-2 text-white">{article.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ 
                    __html: article.description ? article.description.substring(0, 100) + '...' : 'Tidak ada deskripsi'
                  }}></p>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- KONTAK SECTION --- */}
      <section id="contact" className="py-12 sm:py-16 md:py-20 bg-gunmetal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-crimson font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Hubungi Kami</h3>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">Kontak</h2>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-rich-black rounded-xl"
            >
              <MapPin className="mx-auto mb-4 text-goldenrod" size={32} />
              <h3 className="font-heading font-bold mb-2">Alamat</h3>
              <p className="text-gray-400 text-sm">Karanganyar, Jawa Tengah</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 bg-rich-black rounded-xl"
            >
              <Mail className="mx-auto mb-4 text-crimson" size={32} />
              <h3 className="font-heading font-bold mb-2">Email</h3>
              <p className="text-gray-400 text-sm">info@fptikaranganyar.my.id</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-rich-black rounded-xl"
            >
              <Phone className="mx-auto mb-4 text-goldenrod" size={32} />
              <h3 className="font-heading font-bold mb-2">Telepon</h3>
              <p className="text-gray-400 text-sm">+62 XXX XXX XXXX</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 sm:py-10 border-t border-white/10 text-center text-gray-500 text-sm bg-rich-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-6 mb-4">
            <a href="#" className="hover:text-goldenrod transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-goldenrod transition-colors">
              <Facebook size={20} />
            </a>
          </div>
          <p>&copy; 2024 FPTI Karanganyar. All rights reserved.</p>
          <p className="mt-2">
            <a href="/timersistem" className="hover:text-goldenrod transition-colors">Timer Sistem</a> | 
            <a href="/" className="hover:text-goldenrod transition-colors"> Beranda</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
