import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useShipScope } from '../hooks/useShipScope'

function initials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Layout() {
  const { user, logout } = useAuth()
  const { isAdmin, ships, adminShipId, setAdminShipId } = useShipScope()

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">MO</span>
          Maritime Ops
        </span>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/maintenance" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Maintenance
          </NavLink>
          <NavLink to="/drills" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Drills
          </NavLink>
          <NavLink to="/crew" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Crew
          </NavLink>
        </nav>
        {isAdmin && ships.length > 0 && (
          <label className="field-inline">
            Ship
            <select
              className="select select-sm"
              value={adminShipId ?? ''}
              onChange={(e) => setAdminShipId(e.target.value || null)}
            >
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.imoNumber})
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="user-chip" title={user?.email}>
          <span className="user-avatar" aria-hidden="true">{initials(user?.name)}</span>
          <span>
            {user?.name}
            <span className={`badge badge-role-${user?.role.toLowerCase()}`} style={{ marginLeft: 6 }}>
              {user?.role}
            </span>
          </span>
        </span>
        <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
          Log out
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
