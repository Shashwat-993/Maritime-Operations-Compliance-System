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
    return <p>Select a ship (admin) or ensure your user is assigned to a vessel.</p>
  }

  if (isLoading) return <p>Loading crew…</p>
  if (error) return <p>Could not load crew.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ margin: 0 }}>Crew on this ship</h1>
      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
              <th style={{ padding: '0.65rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '0.65rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '0.65rem', fontWeight: 600 }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.65rem' }}>{u.name}</td>
                <td style={{ padding: '0.65rem' }}>{u.email}</td>
                <td style={{ padding: '0.65rem' }}>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(data ?? []).length === 0 && <p>No crew assigned to this ship.</p>}
    </div>
  )
}
