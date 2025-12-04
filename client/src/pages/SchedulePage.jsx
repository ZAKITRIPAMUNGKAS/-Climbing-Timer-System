import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Clock, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function SchedulePage() {
  const events = [
    {
      id: 1,
      date: '15 Desember 2024',
      title: 'Kejurkab Karanganyar 2024',
      location: 'Gedung Olahraga Karanganyar',
      time: '08:00 - 17:00 WIB',
      status: 'upcoming',
      category: 'Kompetisi',
      description: 'Kompetisi panjat tebing tingkat kabupaten dengan berbagai kategori usia dan kelas'
    },
    {
      id: 2,
      date: '10 November 2024',
      title: 'Kejurprov Jawa Tengah',
      location: 'Semarang',
      time: '08:00 - 18:00 WIB',
      status: 'past',
      category: 'Kompetisi',
      description: 'Kejuaraan provinsi Jawa Tengah dengan partisipasi dari seluruh kabupaten/kota'
    },
    {
      id: 3,
      date: '5 Oktober 2024',
      title: 'Kejurnas Indonesia',
      location: 'Jakarta',
      time: '09:00 - 19:00 WIB',
      status: 'past',
      category: 'Kompetisi Nasional',
      description: 'Kejuaraan nasional dengan atlet terbaik dari seluruh Indonesia'
    },
    {
      id: 4,
      date: '20 Januari 2025',
      title: 'Latihan Intensif Pra-Kompetisi',
      location: 'Fasilitas FPTI Karanganyar',
      time: '14:00 - 17:00 WIB',
      status: 'upcoming',
      category: 'Latihan',
      description: 'Program latihan khusus untuk persiapan kompetisi mendatang'
    },
    {
      id: 5,
      date: '25 Januari 2025',
      title: 'Kejurda Jawa Tengah',
      location: 'Solo',
      time: '08:00 - 17:00 WIB',
      status: 'upcoming',
      category: 'Kompetisi',
      description: 'Kejuaraan daerah Jawa Tengah dengan berbagai kategori'
    }
  ]

  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const pastEvents = events.filter(e => e.status === 'past')

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
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-4">Kalender</h3>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">Jadwal Lomba</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Ikuti jadwal kompetisi dan kegiatan FPTI Karanganyar
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-gunmetal">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-heading font-bold mb-8 text-goldenrod">Event Mendatang</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-rich-black rounded-xl p-6 border border-goldenrod/30 hover:border-goldenrod transition-colors"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-goldenrod text-black p-4 rounded-lg text-center min-w-[100px]">
                      <Calendar className="mx-auto mb-2" size={24} />
                      <div className="text-sm font-bold">{event.date.split(' ')[0]}</div>
                      <div className="text-xs">{event.date.split(' ').slice(1).join(' ')}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-block px-3 py-1 bg-crimson/20 text-crimson text-xs rounded-full mb-2 font-bold">
                          {event.category}
                        </span>
                        <h3 className="text-2xl font-heading font-bold text-white mb-2">{event.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{event.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-goldenrod" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-goldenrod" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-20 bg-rich-black">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-heading font-bold mb-8 text-goldenrod">Event Terdahulu</h2>
          <div className="max-w-4xl mx-auto">
            {pastEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="flex gap-6 mb-8 opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                  {index < pastEvents.length - 1 && <div className="w-[2px] h-20 bg-gray-700 mt-2"></div>}
                </div>
                <div className="flex-1 pb-8 border-b border-gray-800">
                  <div className="text-goldenrod text-sm font-bold mb-2">{event.date}</div>
                  <h3 className="text-xl font-heading font-bold mb-2">{event.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {event.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
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

export default SchedulePage

