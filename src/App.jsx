import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AnalyzerPage from './pages/AnalyzerPage'
import ComparisonPage from './pages/ComparisonPage'
import PharmacyPage from './pages/PharmacyPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import PricingPage from './pages/PricingPage'
import ProtectedRoute from './components/ProtectedRoute'
import GlobalChatbot from './components/GlobalChatbot'

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected app routes (with sidebar layout) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="analyzer" element={<AnalyzerPage />} />
          <Route path="comparison" element={<ComparisonPage />} />
          <Route path="pharmacy" element={<PharmacyPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="upgrade" element={<PricingPage />} />
        </Route>
      </Routes>
      <GlobalChatbot />
    </>
  )
}

export default App
