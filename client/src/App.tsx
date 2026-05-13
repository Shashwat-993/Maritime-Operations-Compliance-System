import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { DrillsPage } from './pages/DrillsPage'
import { CrewPage } from './pages/CrewPage'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <p style={{ padding: 24 }}>Loading…</p>
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="drills" element={<DrillsPage />} />
        <Route path="crew" element={<CrewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
