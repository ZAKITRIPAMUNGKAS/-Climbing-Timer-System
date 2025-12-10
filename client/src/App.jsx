import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import AthletesPage from './pages/AthletesPage'
import SchedulePage from './pages/SchedulePage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import ContactPage from './pages/ContactPage'
import LiveScorePage from './pages/LiveScorePage'
import SpeedScorePage from './pages/SpeedScorePage'
import LiveScoreSelectorPage from './pages/LiveScoreSelectorPage'
import BigScreenPage from './pages/BigScreenPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AthletesManagementPage from './pages/AthletesManagementPage'
import CompetitionsManagementPage from './pages/CompetitionsManagementPage'
import UsersManagementPage from './pages/UsersManagementPage'
import JudgeInterfacePage from './pages/JudgeInterfacePage'
import SchedulesManagementPage from './pages/SchedulesManagementPage'
import NewsManagementPage from './pages/NewsManagementPage'
import SettingsPage from './pages/SettingsPage'
import ClimbersPhotoManagementPage from './pages/ClimbersPhotoManagementPage'
import SpeedOverlay from './pages/SpeedOverlay'
import SpeedLeaderboardOverlay from './pages/SpeedLeaderboardOverlay'
import BoulderCurrentOverlay from './pages/BoulderCurrentOverlay'
import BoulderTimerOverlay from './pages/BoulderTimerOverlay'
import BoulderLeaderboardOverlay from './pages/BoulderLeaderboardOverlay'
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
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/tentang" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/atlet" element={<PublicLayout><AthletesPage /></PublicLayout>} />
        <Route path="/jadwal" element={<PublicLayout><SchedulePage /></PublicLayout>} />
        <Route path="/berita" element={<PublicLayout><NewsPage /></PublicLayout>} />
        <Route path="/berita/:id" element={<PublicLayout><NewsDetailPage /></PublicLayout>} />
        <Route path="/kontak" element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/live-score-selector" element={<PublicLayout><LiveScoreSelectorPage /></PublicLayout>} />
        <Route path="/live-score" element={<PublicLayout><LiveScorePage /></PublicLayout>} />
        <Route path="/speed-score" element={<PublicLayout><SpeedScorePage /></PublicLayout>} />
        <Route path="/big-screen/:competitionId" element={<BigScreenPage />} />
        
        {/* OBS Overlay Routes */}
        <Route path="/overlay/speed-lower-third" element={<SpeedOverlay />} />
        <Route path="/overlay/speed-leaderboard" element={<SpeedLeaderboardOverlay />} />
        <Route path="/overlay/boulder-current" element={<BoulderCurrentOverlay />} />
        <Route path="/overlay/boulder-timer" element={<BoulderTimerOverlay />} />
        <Route path="/overlay/boulder-leaderboard" element={<BoulderLeaderboardOverlay />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/competitions" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CompetitionsManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/athletes" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AthletesManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UsersManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/judge-interface" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <JudgeInterfacePage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        {/* Fullscreen Judge Interface (No Sidebar) */}
        <Route 
          path="/judge-interface-fullscreen" 
          element={
            <ProtectedRoute>
              <JudgeInterfacePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/schedules" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SchedulesManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/news" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <NewsManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/settings" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/competitions/:competitionId/climbers-photos" 
          element={
            <ProtectedRoute>
              <ClimbersPhotoManagementPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 */}
        <Route path="*" element={<PublicLayout><LandingPage /></PublicLayout>} />
      </Routes>
    </Router>
  )
}

export default App

