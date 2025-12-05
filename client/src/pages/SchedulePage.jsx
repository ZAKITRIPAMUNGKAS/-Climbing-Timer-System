import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import './LandingPage.css'

function SchedulePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/schedules')
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error('Error fetching schedules:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const pastEvents = events.filter(e => e.status === 'past')

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
            {loading ? (
              <div className="text-center text-gray-400 py-10">Memuat data...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-10">Belum ada event mendatang</div>
            ) : (
              upcomingEvents.map((event, index) => (
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
              ))
            )}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-20 bg-rich-black">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-heading font-bold mb-8 text-goldenrod">Event Terdahulu</h2>
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center text-gray-400 py-10">Memuat data...</div>
            ) : pastEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-10">Belum ada event terdahulu</div>
            ) : (
              pastEvents.map((event, index) => (
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

export default SchedulePage

