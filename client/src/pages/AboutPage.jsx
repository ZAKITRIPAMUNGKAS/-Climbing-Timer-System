import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, Target, Medal, CheckCircle2 } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import './LandingPage.css'

function AboutPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <PublicLayout>
      <div className="bg-[#0a0a0a] min-h-screen text-zinc-200 font-sans selection:bg-[#FFB800] selection:text-black">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-[#111111] border-b border-zinc-800 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full opacity-5 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FFB800] rounded-full blur-[120px]"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="flex justify-center mb-8 relative">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FFB800] to-yellow-600 rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                  <img 
                    src="/logo.jpeg" 
                    alt="FPTI Karanganyar" 
                    className="relative w-40 h-40 rounded-full object-cover border-2 border-[#FFB800]/50 shadow-2xl"
                  />
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-bold tracking-widest uppercase">
                <Medal size={14} />
                <span>Est. 2014</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 text-white uppercase tracking-tight leading-none">
                FPTI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-yellow-600">Karanganyar</span>
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
                Wadah resmi pengembangan atlet panjat tebing di Kabupaten Karanganyar. 
                Membentuk karakter <span className="text-white font-semibold">tangguh</span>, <span className="text-white font-semibold">disiplin</span>, dan <span className="text-[#FFB800] font-semibold">berprestasi</span>.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-12 -mt-10 relative z-20">
          <div className="container mx-auto px-6">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
            >
              {[
                { icon: Users, count: "50+", label: "Atlet Aktif" },
                { icon: Trophy, count: "20+", label: "Kejuaraan" },
                { icon: Calendar, count: "10+", label: "Tahun Pengalaman" },
                { icon: Target, count: "100+", label: "Total Medali" }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="bg-[#111111] p-6 rounded-sm border border-zinc-800 text-center hover:border-[#FFB800]/50 transition-colors duration-300 group"
                >
                  <stat.icon className="mx-auto mb-3 text-zinc-600 group-hover:text-[#FFB800] transition-colors" size={28} />
                  <div className="text-3xl font-black text-white mb-1">{stat.count}</div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider font-bold">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Visi Misi Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-start">
                
                {/* Visi */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#111111] p-8 rounded-sm border border-zinc-800 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFB800] opacity-5 rounded-bl-full -mr-4 -mt-4"></div>
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="text-[#FFB800]" size={28} />
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">Visi Kami</h2>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-lg">
                    Menjadi pusat pengembangan olahraga panjat tebing terdepan di Jawa Tengah, 
                    menghasilkan atlet-atlet berprestasi nasional dan internasional, serta 
                    membangun karakter sportivitas dan disiplin tinggi.
                  </p>
                </motion.div>

                {/* Misi */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="text-[#FFB800]" size={28} />
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">Misi Kami</h2>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Mengembangkan bakat dan potensi atlet panjat tebing di Karanganyar",
                      "Menyediakan fasilitas dan pelatihan profesional untuk atlet",
                      "Mengadakan kompetisi berkualitas untuk meningkatkan prestasi",
                      "Membangun jaringan dengan komunitas panjat tebing nasional",
                      "Mempromosikan olahraga panjat tebing di masyarakat"
                    ].map((misi, idx) => (
                      <li key={idx} className="flex gap-4 items-start group">
                        <CheckCircle2 className="text-zinc-700 group-hover:text-[#FFB800] transition-colors mt-1 flex-shrink-0" size={18} />
                        <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">{misi}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

              </div>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="py-20 bg-[#111111] border-y border-zinc-800">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-wide">
                Jejak <span className="text-[#FFB800]">Sejarah</span>
              </h2>
              <div className="space-y-6 text-zinc-400 leading-relaxed text-lg font-light">
                <p>
                  <strong className="text-white font-bold">FPTI Karanganyar</strong> didirikan dengan semangat untuk mengembangkan olahraga panjat tebing 
                  di wilayah Karanganyar. Sejak awal, kami berkomitmen untuk memberikan pelatihan berkualitas 
                  dan menyediakan fasilitas yang memadai bagi para atlet.
                </p>
                <div className="w-16 h-1 bg-[#FFB800] mx-auto opacity-30"></div>
                <p>
                  Melalui berbagai program dan kompetisi yang kami selenggarakan, kami telah berhasil 
                  mencetak banyak atlet berprestasi yang mengharumkan nama Karanganyar di tingkat 
                  provinsi, nasional, bahkan internasional.
                </p>
                <p>
                  Hingga saat ini, kami terus berkembang dan menjadi salah satu komunitas 
                  panjat tebing terdepan di Jawa Tengah, dengan fokus pada pengembangan atlet muda dan 
                  peningkatan prestasi di berbagai kompetisi.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-[#0a0a0a] text-center">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity duration-300">
              <Medal className="text-[#FFB800]" size={24} />
              <span className="text-xl font-bold text-white tracking-widest">FPTI KARANGANYAR</span>
            </div>
            <p className="text-zinc-600 text-sm">
              &copy; {new Date().getFullYear()} Official Organization Profile. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </PublicLayout>
  )
}

export default AboutPage