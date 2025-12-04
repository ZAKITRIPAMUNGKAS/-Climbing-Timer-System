import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Mail, Phone, Instagram, Facebook, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    alert('Terima kasih! Pesan Anda telah terkirim.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

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
            <h3 className="text-crimson font-bold uppercase tracking-widest text-sm mb-4">Hubungi Kami</h3>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">Kontak</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Ada pertanyaan? Ingin bergabung? Atau butuh informasi lebih lanjut? Hubungi kami!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-20 bg-gunmetal">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-heading font-bold mb-8 text-goldenrod">Informasi Kontak</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4 p-4 bg-rich-black rounded-xl border border-white/10">
                  <div className="bg-goldenrod/20 p-3 rounded-lg">
                    <MapPin className="text-goldenrod" size={24} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold mb-1">Alamat</h3>
                    <p className="text-gray-400">Karanganyar, Jawa Tengah</p>
                    <p className="text-gray-400 text-sm">Indonesia</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-rich-black rounded-xl border border-white/10">
                  <div className="bg-crimson/20 p-3 rounded-lg">
                    <Mail className="text-crimson" size={24} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold mb-1">Email</h3>
                    <a href="mailto:info@fptikaranganyar.my.id" className="text-goldenrod hover:text-goldenrod/80 transition-colors">
                      info@fptikaranganyar.my.id
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-rich-black rounded-xl border border-white/10">
                  <div className="bg-goldenrod/20 p-3 rounded-lg">
                    <Phone className="text-goldenrod" size={24} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold mb-1">Telepon</h3>
                    <a href="tel:+6281234567890" className="text-goldenrod hover:text-goldenrod/80 transition-colors">
                      +62 812 3456 7890
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading font-bold mb-4">Ikuti Kami</h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="bg-rich-black p-4 rounded-lg border border-white/10 hover:border-goldenrod hover:bg-goldenrod/10 transition-all"
                  >
                    <Instagram className="text-goldenrod" size={24} />
                  </a>
                  <a 
                    href="#" 
                    className="bg-rich-black p-4 rounded-lg border border-white/10 hover:border-goldenrod hover:bg-goldenrod/10 transition-all"
                  >
                    <Facebook className="text-goldenrod" size={24} />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-heading font-bold mb-8 text-goldenrod">Kirim Pesan</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Nama</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-rich-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-goldenrod"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-rich-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-goldenrod"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Subjek</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-rich-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-goldenrod"
                    placeholder="Subjek pesan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Pesan</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-rich-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-goldenrod resize-none"
                    placeholder="Tulis pesan Anda di sini..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-crimson text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Kirim Pesan
                </button>
              </form>
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

export default ContactPage

