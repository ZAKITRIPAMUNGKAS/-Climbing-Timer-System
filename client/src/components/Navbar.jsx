import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogIn, BarChart3 } from 'lucide-react'

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Tentang Atlet', href: '/atlet' },
    { name: 'Jadwal', href: '/jadwal' },
    { name: 'Live Score', href: '/live-score-selector' },
    { name: 'Berita', href: '/berita' },
    { name: 'Kontak', href: '/kontak' },
  ]

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/90 backdrop-blur-xl shadow-lg border-b border-white/10 py-4' 
        : 'bg-black/70 backdrop-blur-2xl border-b border-white/5 py-5'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="/logo.jpeg" 
            alt="FPTI Karanganyar" 
            className="w-10 h-10 rounded-full object-cover border-2 border-goldenrod/50 group-hover:border-goldenrod transition-all duration-300 shadow-[0_0_15px_rgba(255,193,7,0.3)]"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-tight">FPTI</span>
            <span className="text-[10px] text-goldenrod uppercase tracking-wider">Karanganyar</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href} 
              className={`text-sm font-medium transition-colors duration-200 relative group ${
                location.pathname === link.href
                  ? 'text-goldenrod'
                  : 'text-gray-300 hover:text-goldenrod'
              }`}
            >
              {link.name}
              {location.pathname === link.href && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-goldenrod"></span>
              )}
            </Link>
          ))}
          
          {/* Login Button - Golden Pill */}
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2.5 bg-crimson text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-[0_0_15px_rgba(225,29,35,0.3)] font-semibold text-sm"
          >
            <LogIn size={16} />
            <span>Login</span>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-gray-300 hover:text-goldenrod transition-colors" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10">
          <div className="container mx-auto px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href} 
                className={`block py-2 text-base font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-goldenrod'
                    : 'text-gray-300 hover:text-goldenrod'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-crimson text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-[0_0_15px_rgba(225,29,35,0.3)] font-semibold mt-4"
            >
              <LogIn size={18} />
              <span>Login</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

