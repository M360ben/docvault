import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/layout/LoadingSpinner'

// Pages
import LandingPage      from './pages/LandingPage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import DashboardPage    from './pages/DashboardPage'
import UploadPage       from './pages/UploadPage'
import MyDocumentsPage  from './pages/MyDocumentsPage'
import PublicLibraryPage from './pages/PublicLibraryPage'
import DocumentViewPage from './pages/DocumentViewPage'
import ModerationPage   from './pages/ModerationPage'
import AdminPage        from './pages/AdminPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? children : <Navigate to="/login" replace />
}

function RequireMod({ children }) {
  const { isModerator, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return isModerator ? children : <Navigate to="/app/dashboard" replace />
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return isAdmin ? children : <Navigate to="/app/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/library"  element={<PublicLibraryPage />} />
      <Route path="/doc/:id"  element={<DocumentViewPage />} />

	{/* Auth-required routes */}
	<Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="upload"       element={<UploadPage />} />
        <Route path="my-documents" element={<MyDocumentsPage />} />

        {/* Moderator routes */}
        <Route path="moderation" element={<RequireMod><ModerationPage /></RequireMod>} />

        {/* Admin routes */}
        <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
