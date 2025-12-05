import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import AthletesPage from './pages/AthletesPage'
import SchedulePage from './pages/SchedulePage'
import NewsPage from './pages/NewsPage'
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
        <Route path="/kontak" element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/live-score-selector" element={<PublicLayout><LiveScoreSelectorPage /></PublicLayout>} />
        <Route path="/live-score" element={<PublicLayout><LiveScorePage /></PublicLayout>} />
        <Route path="/speed-score" element={<PublicLayout><SpeedScorePage /></PublicLayout>} />
        <Route path="/big-screen/:competitionId" element={<BigScreenPage />} />
        
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
          path="/dashboard/settings" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </DashboardLayout>
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

