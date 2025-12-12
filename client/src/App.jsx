import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy load pages untuk code splitting dan mengurangi initial bundle size
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AthletesPage = lazy(() => import('./pages/AthletesPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LiveScorePage = lazy(() => import('./pages/LiveScorePage'))
const SpeedScorePage = lazy(() => import('./pages/SpeedScorePage'))
const LiveScoreSelectorPage = lazy(() => import('./pages/LiveScoreSelectorPage'))
const BigScreenPage = lazy(() => import('./pages/BigScreenPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AthletesManagementPage = lazy(() => import('./pages/AthletesManagementPage'))
const CompetitionsManagementPage = lazy(() => import('./pages/CompetitionsManagementPage'))
const UsersManagementPage = lazy(() => import('./pages/UsersManagementPage'))
const JudgeInterfacePage = lazy(() => import('./pages/JudgeInterfacePage'))
const BoulderRouteJudgingPage = lazy(() => import('./pages/BoulderRouteJudgingPage'))
const SchedulesManagementPage = lazy(() => import('./pages/SchedulesManagementPage'))
const NewsManagementPage = lazy(() => import('./pages/NewsManagementPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ClimbersPhotoManagementPage = lazy(() => import('./pages/ClimbersPhotoManagementPage'))
const ClimbersManagementPage = lazy(() => import('./pages/ClimbersManagementPage'))
const SpeedOverlay = lazy(() => import('./pages/SpeedOverlay'))
const SpeedLeaderboardOverlay = lazy(() => import('./pages/SpeedLeaderboardOverlay'))
const BoulderCurrentOverlay = lazy(() => import('./pages/BoulderCurrentOverlay'))
const BoulderTimerOverlay = lazy(() => import('./pages/BoulderTimerOverlay'))
const BoulderLeaderboardOverlay = lazy(() => import('./pages/BoulderLeaderboardOverlay'))

import './App.css'

// Loading component untuk suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
)

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<PageLoader />}>
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
          path="/dashboard/climbers" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClimbersManagementPage />
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
        {/* Boulder Route Judging Page - Mobile Optimized */}
        <Route 
          path="/judge-interface/boulder/:competitionId/route/:routeNumber" 
          element={
            <ProtectedRoute>
              <BoulderRouteJudgingPage />
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
      </Suspense>
    </Router>
  )
}

export default App

