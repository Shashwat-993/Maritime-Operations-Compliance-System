import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useShipScope } from '../hooks/useShipScope'
import { useTheme } from '../context/ThemeContext'
import { api } from '../api/client'
import type { ComplianceResponse } from '../api/types'

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
  const { theme, toggleTheme } = useTheme()
  const { isAdmin, ships, adminShipId, setAdminShipId, effectiveShipId, shipQuery } = useShipScope()

  const { data: compliance } = useQuery({
    queryKey: ['compliance', effectiveShipId],
    enabled: Boolean(effectiveShipId),
    queryFn: async () => {
      const { data } = await api.get<ComplianceResponse>('/api/compliance', { params: shipQuery })
      return data
    },
  })

  const overdueCount = compliance?.overdue.length ?? 0
  const missedCount = compliance?.counts.drillsMissed ?? 0

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v14" />
              <path d="M5 12H3a9 9 0 0 0 18 0h-2" />
              <path d="M9 19l3 2 3-2" />
            </svg>
          </span>
          Maritime Ops
        </span>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/maintenance" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Maintenance
            {overdueCount > 0 && (
              <span className="nav-badge nav-badge-danger" title={`${overdueCount} overdue`}>
                {overdueCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/drills" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
            Drills
            {missedCount > 0 && (
              <span className="nav-badge nav-badge-danger" title={`${missedCount} missed`}>
                {missedCount}
              </span>
            )}
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
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M4.93 19.07l1.41-1.41" />
              <path d="M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
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
