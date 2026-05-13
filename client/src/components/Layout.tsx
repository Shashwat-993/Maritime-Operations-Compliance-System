import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useShipScope } from '../hooks/useShipScope'

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  fontWeight: isActive ? 600 : 500,
  color: isActive ? '#0c4a6e' : '#334155',
  padding: '0.35rem 0.6rem',
  borderRadius: 6,
  background: isActive ? '#e0f2fe' : 'transparent',
})

export function Layout() {
  const { user, logout } = useAuth()
  const { isAdmin, ships, adminShipId, setAdminShipId } = useShipScope()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ color: '#0f172a' }}>Maritime Operations & Compliance System</strong>
        <nav style={{ display: 'flex', gap: '0.35rem', flex: 1, flexWrap: 'wrap' }}>
          <NavLink to="/" end style={navStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/maintenance" style={navStyle}>
            Maintenance
          </NavLink>
          <NavLink to="/drills" style={navStyle}>
            Drills
          </NavLink>
          <NavLink to="/crew" style={navStyle}>
            Crew
          </NavLink>
        </nav>
        {isAdmin && ships.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            Ship
            <select
              value={adminShipId ?? ''}
              onChange={(e) => setAdminShipId(e.target.value || null)}
              style={{ padding: '0.35rem 0.5rem' }}
            >
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.imoNumber})
                </option>
              ))}
            </select>
          </label>
        )}
        <span style={{ fontSize: 14, color: '#475569' }}>
          {user?.name} · {user?.role}
        </span>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: '0.35rem 0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            background: '#fff',
          }}
        >
          Log out
        </button>
      </header>
      <main style={{ flex: 1, padding: '1.25rem', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
