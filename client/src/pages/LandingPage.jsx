import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronRight, Clock, Calendar, Users, Newspaper, Trophy, MapPin, Mail, Phone, Instagram, Facebook } from 'lucide-react'
import './LandingPage.css'

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Beranda', href: '/', isHash: false },
    { name: 'Tentang', href: '/tentang', isHash: false },
    { name: 'Atlet', href: '/atlet', isHash: false },
    { name: 'Jadwal', href: '/jadwal', isHash: false },
    { name: 'Berita', href: '/berita', isHash: false },
    { name: 'Kontak', href: '/kontak', isHash: false },
  ]

  return (
    <div className="bg-rich-black min-h-screen text-off-white font-body selection:bg-crimson selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          
          {/* Logo Branding */}
          <a href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.jpeg" 
              alt="FPTI Karanganyar" 
              className="w-12 h-12 rounded-full object-cover border-2 border-goldenrod/50 group-hover:border-goldenrod group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(255,193,7,0.3)]"
              onError={(e) => {
                console.error('Logo failed to load:', e.target.src);
                // Fallback jika logo tidak ter-load
                e.target.style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl tracking-wider">FPTI</span>
              <span className="text-[10px] text-goldenrod uppercase tracking-[0.2em]">Karanganyar</span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.isHash ? (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-sm uppercase tracking-wide hover:text-crimson transition-colors duration-300 relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-crimson transition-all duration-300 group-hover:w-full"></span>
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="text-sm uppercase tracking-wide hover:text-crimson transition-colors duration-300 relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-crimson transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )
            ))}
            
            {/* Timer Sistem Button */}
            <a 
              href="/timersistem"
              className="flex items-center gap-2 px-5 py-2 border border-goldenrod/50 text-goldenrod rounded-full hover:bg-goldenrod hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(255,193,7,0.2)]"
            >
              <Clock size={16} />
              <span className="text-xs font-bold uppercase">Timer Sistem</span>
            </a>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-black border-b border-gray-800 p-6 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              link.isHash ? (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-lg font-medium hover:text-crimson"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="text-lg font-medium hover:text-crimson"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
            ))}
            <a 
              href="/timersistem"
              className="mt-2 w-full py-3 bg-crimson text-white font-bold rounded text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Timer Sistem
            </a>
          </motion.div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=2003&auto=format&fit=crop')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-rich-black via-rich-black/70 to-transparent"></div>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center md:text-left pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-goldenrod font-bold tracking-[0.2em] text-sm mb-4 uppercase">Federasi Panjat Tebing Indonesia</h2>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-tight mb-6">
              Raih Puncak <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                Tanpa Batas
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
              Wadah resmi pengembangan atlet panjat tebing di Kabupaten Karanganyar. 
              Membentuk karakter tangguh, disiplin, dan berprestasi.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Link 
                to="/jadwal"
                className="px-8 py-4 bg-crimson text-white font-bold rounded hover:bg-red-700 transition-all flex items-center justify-center gap-2 group"
              >
                Lihat Jadwal Lomba
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/atlet"
                className="px-8 py-4 border border-white/20 text-white font-bold rounded hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Profil Atlet
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats Card */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="hidden md:block absolute bottom-20 right-20 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-64 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
            <div className="bg-goldenrod p-2 rounded-lg text-black">
              <Calendar size={20}/>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Event Selanjutnya</p>
              <p className="font-bold text-sm">Kejurkab Karanganyar</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-crimson">12</div>
            <div className="text-sm text-gray-400 mb-1">Hari lagi</div>
          </div>
        </motion.div>
      </section>

      {/* --- TENTANG SECTION --- */}
      <section id="about" className="py-20 bg-gunmetal">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.jpeg" 
                alt="FPTI Karanganyar" 
                className="w-32 h-32 rounded-full object-cover border-4 border-goldenrod/50 shadow-[0_0_30px_rgba(255,193,7,0.3)]"
              />
            </div>
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-2">Tentang Kami</h3>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">FPTI Karanganyar</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              FPTI Karanganyar adalah komunitas panjat tebing yang berdedikasi untuk mengembangkan 
              olahraga panjat tebing di wilayah Karanganyar dan sekitarnya. Kami menyediakan fasilitas, 
              pelatihan, dan sistem timer profesional untuk mendukung kegiatan kompetisi dan latihan panjat tebing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
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
      <section id="athletes" className="py-20 bg-rich-black">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-2">Squad Kami</h3>
              <h2 className="text-4xl font-heading font-bold">Atlet Berprestasi</h2>
            </div>
            <Link 
              to="/atlet"
              className="text-sm border-b border-goldenrod text-goldenrod pb-1 hover:text-white hover:border-white transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 1,
                name: 'Ahmad Rizki',
                category: 'Speed Climbing',
                achievement: 'Medali Emas Kejurnas 2024',
                image: 'https://picsum.photos/seed/climbing1/800/600'
              },
              {
                id: 2,
                name: 'Siti Nurhaliza',
                category: 'Lead / Boulder',
                achievement: 'Juara 1 Kejurprov Jateng',
                image: 'https://picsum.photos/seed/climbing2/800/600'
              },
              {
                id: 3,
                name: 'Budi Santoso',
                category: 'Boulder',
                achievement: 'Medali Perak Porprov 2024',
                image: 'https://picsum.photos/seed/climbing3/800/600'
              }
            ].map((athlete, index) => (
              <motion.div
                key={athlete.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative h-[400px] rounded-xl overflow-hidden cursor-pointer"
              >
                <img 
                  src={athlete.image}
                  alt={athlete.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback ke placeholder jika gambar gagal load
                    e.target.src = `https://via.placeholder.com/800x600/E11D23/FFFFFF?text=${encodeURIComponent(athlete.name)}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="bg-goldenrod text-black text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                    {athlete.category}
                  </span>
                  <h3 className="text-2xl font-heading font-bold text-white mb-1">{athlete.name}</h3>
                  <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {athlete.achievement}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- JADWAL SECTION --- */}
      <section id="schedule" className="py-20 bg-gunmetal">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-2">Kalender</h3>
            <h2 className="text-4xl font-heading font-bold">Jadwal Lomba</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              { date: '15 Des 2024', title: 'Kejurkab Karanganyar', status: 'upcoming' },
              { date: '10 Nov 2024', title: 'Kejurprov Jateng', status: 'past' },
              { date: '5 Okt 2024', title: 'Kejurnas Indonesia', status: 'past' },
            ].map((event, index) => (
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
                  {event.status === 'upcoming' && (
                    <span className="inline-block px-3 py-1 bg-crimson/20 text-crimson text-xs rounded-full">
                      Akan Datang
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BERITA SECTION --- */}
      <section id="news" className="py-20 bg-rich-black">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-2">Update</h3>
              <h2 className="text-4xl font-heading font-bold">Berita & Artikel</h2>
            </div>
            <Link 
              to="/atlet"
              className="text-sm border-b border-goldenrod text-goldenrod pb-1 hover:text-white hover:border-white transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                id: 1,
                category: 'Kompetisi', 
                color: 'crimson',
                title: 'Kejurkab Karanganyar 2024 Sukses Digelar',
                description: 'Kompetisi panjat tebing tingkat kabupaten berhasil diselenggarakan dengan antusiasme tinggi dari peserta...',
                image: 'https://picsum.photos/seed/news1/800/600'
              },
              { 
                id: 2,
                category: 'Latihan', 
                color: 'goldenrod',
                title: 'Program Latihan Intensif untuk Atlet Muda',
                description: 'FPTI Karanganyar meluncurkan program latihan khusus untuk mengembangkan bakat atlet muda...',
                image: 'https://picsum.photos/seed/news2/800/600'
              },
              { 
                id: 3,
                category: 'Prestasi', 
                color: 'crimson',
                title: 'Atlet FPTI Raih Medali di Kejurprov',
                description: 'Prestasi membanggakan diraih oleh atlet FPTI Karanganyar dalam kejuaraan provinsi Jawa Tengah...',
                image: 'https://picsum.photos/seed/news3/800/600'
              },
            ].map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-gunmetal rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer group"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback ke placeholder jika gambar gagal load
                      e.target.src = `https://via.placeholder.com/800x600/E11D23/FFFFFF?text=${encodeURIComponent(news.category)}`;
                    }}
                  />
                </div>
                <div className="p-6">
                  <span className={`inline-block px-3 py-1 ${
                    news.color === 'crimson' 
                      ? 'bg-crimson/20 text-crimson' 
                      : 'bg-goldenrod/20 text-goldenrod'
                  } text-xs rounded-full mb-3 font-bold`}>
                    {news.category}
                  </span>
                  <h3 className="text-xl font-heading font-bold mb-2 text-white">{news.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{news.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- KONTAK SECTION --- */}
      <section id="contact" className="py-20 bg-gunmetal">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-2">Hubungi Kami</h3>
            <h2 className="text-4xl font-heading font-bold">Kontak</h2>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
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
      <footer className="py-10 border-t border-white/10 text-center text-gray-500 text-sm bg-rich-black">
        <div className="container mx-auto px-6">
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
