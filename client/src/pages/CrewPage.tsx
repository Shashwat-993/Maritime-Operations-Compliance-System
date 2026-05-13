import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CrewMember } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'

export function CrewPage() {
  const { effectiveShipId, shipQuery } = useShipScope()

  const { data, isLoading, error } = useQuery({
    queryKey: ['crew', effectiveShipId],
    enabled: Boolean(effectiveShipId),
    queryFn: async () => {
      const { data: res } = await api.get<CrewMember[]>('/api/users', { params: shipQuery })
      return res
    },
  })

  if (!effectiveShipId) {
    return <div className="card alert-empty">Select a ship (admin) or ensure your user is assigned to a vessel.</div>
  }

  if (isLoading) return <div className="card skeleton" style={{ height: 180 }} />
  if (error) return <div className="alert alert-error">Could not load crew.</div>

  return (
    <div className="stack">
      <div>
        <h1>Crew on this ship</h1>
        <p className="muted text-sm" style={{ marginTop: 4 }}>
          {(data ?? []).length} member{(data ?? []).length === 1 ? '' : 's'} assigned.
        </p>
      </div>
      <div className="card card-flush">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <span className={`badge badge-role-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data ?? []).length === 0 && <div className="alert-empty">No crew assigned to this ship.</div>}
      </div>
    </div>
  )
}
