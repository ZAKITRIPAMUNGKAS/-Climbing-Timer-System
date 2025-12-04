import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Users, Calendar, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function AboutPage() {
  return (
    <div className="bg-rich-black min-h-screen text-off-white font-body">
      {/* Navbar Simple */}
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
      <section className="pt-32 pb-20 bg-gradient-to-b from-gunmetal to-rich-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="flex justify-center mb-8">
              <img 
                src="/logo.jpeg" 
                alt="FPTI Karanganyar" 
                className="w-40 h-40 rounded-full object-cover border-4 border-goldenrod/50 shadow-[0_0_40px_rgba(255,193,7,0.3)]"
              />
            </div>
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-4">Tentang Kami</h3>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">FPTI Karanganyar</h1>
            <p className="text-gray-400 text-xl leading-relaxed mb-12">
              Wadah resmi pengembangan atlet panjat tebing di Kabupaten Karanganyar. 
              Membentuk karakter tangguh, disiplin, dan berprestasi.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-gunmetal">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-heading font-bold mb-6 text-goldenrod">Visi & Misi</h2>
              <div className="space-y-6 text-gray-300 leading-relaxed">
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Visi</h3>
                  <p>
                    Menjadi pusat pengembangan olahraga panjat tebing terdepan di Jawa Tengah, 
                    menghasilkan atlet-atlet berprestasi nasional dan internasional, serta 
                    membangun karakter sportivitas dan disiplin tinggi.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Misi</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Mengembangkan bakat dan potensi atlet panjat tebing di Karanganyar</li>
                    <li>Menyediakan fasilitas dan pelatihan profesional untuk atlet</li>
                    <li>Mengadakan kompetisi berkualitas untuk meningkatkan prestasi</li>
                    <li>Membangun jaringan dengan komunitas panjat tebing nasional</li>
                    <li>Mempromosikan olahraga panjat tebing di masyarakat</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              <div className="text-center p-6 bg-rich-black rounded-xl border border-white/10">
                <Users className="mx-auto mb-3 text-goldenrod" size={32} />
                <div className="text-3xl font-bold text-crimson mb-1">50+</div>
                <div className="text-gray-400 text-sm">Atlet Aktif</div>
              </div>
              <div className="text-center p-6 bg-rich-black rounded-xl border border-white/10">
                <Trophy className="mx-auto mb-3 text-goldenrod" size={32} />
                <div className="text-3xl font-bold text-crimson mb-1">20+</div>
                <div className="text-gray-400 text-sm">Kejuaraan</div>
              </div>
              <div className="text-center p-6 bg-rich-black rounded-xl border border-white/10">
                <Calendar className="mx-auto mb-3 text-goldenrod" size={32} />
                <div className="text-3xl font-bold text-crimson mb-1">10+</div>
                <div className="text-gray-400 text-sm">Tahun Pengalaman</div>
              </div>
              <div className="text-center p-6 bg-rich-black rounded-xl border border-white/10">
                <Target className="mx-auto mb-3 text-goldenrod" size={32} />
                <div className="text-3xl font-bold text-crimson mb-1">100+</div>
                <div className="text-gray-400 text-sm">Medali</div>
              </div>
            </motion.div>

            {/* History */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="text-3xl font-heading font-bold mb-6 text-goldenrod">Sejarah</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  FPTI Karanganyar didirikan dengan semangat untuk mengembangkan olahraga panjat tebing 
                  di wilayah Karanganyar. Sejak awal, kami berkomitmen untuk memberikan pelatihan berkualitas 
                  dan menyediakan fasilitas yang memadai bagi para atlet.
                </p>
                <p>
                  Melalui berbagai program dan kompetisi yang kami selenggarakan, kami telah berhasil 
                  mencetak banyak atlet berprestasi yang mengharumkan nama Karanganyar di tingkat 
                  provinsi, nasional, bahkan internasional.
                </p>
                <p>
                  Hingga saat ini, FPTI Karanganyar terus berkembang dan menjadi salah satu komunitas 
                  panjat tebing terdepan di Jawa Tengah, dengan fokus pada pengembangan atlet muda dan 
                  peningkatan prestasi di berbagai kompetisi.
                </p>
              </div>
            </motion.div>
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
  )
}

export default AboutPage

