import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import AthletesPage from './pages/AthletesPage'
import SchedulePage from './pages/SchedulePage'
import NewsPage from './pages/NewsPage'
import ContactPage from './pages/ContactPage'
import './App.css'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tentang" element={<AboutPage />} />
        <Route path="/atlet" element={<AthletesPage />} />
        <Route path="/jadwal" element={<SchedulePage />} />
        <Route path="/berita" element={<NewsPage />} />
        <Route path="/kontak" element={<ContactPage />} />
        {/* Route /timersistem di-handle oleh server, tidak perlu di React Router */}
      </Routes>
    </Router>
  )
}

export default App

