import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { ComplianceResponse } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function DashboardPage() {
  const { effectiveShipId, shipQuery } = useShipScope()

  const { data, isLoading, error } = useQuery({
    queryKey: ['compliance', effectiveShipId],
    enabled: Boolean(effectiveShipId),
    queryFn: async () => {
      const { data: res } = await api.get<ComplianceResponse>('/api/compliance', {
        params: shipQuery,
      })
      return res
    },
  })

  if (!effectiveShipId) {
    return <p>Select a ship (admin) or ensure your user is assigned to a vessel.</p>
  }

  if (isLoading) return <p>Loading compliance…</p>
  if (error || !data) return <p>Could not load compliance.</p>

  const chartData = [
    { name: 'Maintenance', value: data.maintenanceScore ?? 0 },
    { name: 'Drills', value: data.drillScore ?? 0 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ margin: 0 }}>Dashboard</h1>
      <p style={{ margin: 0, color: '#475569' }}>
        Scores use all tasks and drills for this ship. Empty denominators show as{' '}
        <em>n/a</em> in the API (<code>null</code>).
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={card}>
          <div style={label}>Maintenance compliance</div>
          <div style={score}>
            {data.maintenanceScore === null ? 'n/a' : `${data.maintenanceScore.toFixed(1)}%`}
          </div>
          <div style={meta}>
            {data.counts.tasksCompleted} / {data.counts.tasksTotal} tasks completed
          </div>
        </div>
        <div style={card}>
          <div style={label}>Drill compliance</div>
          <div style={score}>
            {data.drillScore === null ? 'n/a' : `${data.drillScore.toFixed(1)}%`}
          </div>
          <div style={meta}>
            {data.counts.attendanceAttended} yes / {data.counts.drillsTotal} drills (see README for
            metric)
          </div>
        </div>
      </div>
      <div style={{ ...card, minHeight: 280 }}>
        <div style={label}>Scores overview</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Score']} />
            <Bar dataKey="value" fill="#0369a1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={label}>Overdue maintenance</div>
        {data.overdue.length === 0 ? (
          <p style={{ margin: 0, color: '#15803d' }}>No overdue tasks.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {data.overdue.map((t) => (
              <li key={t.id}>
                {t.title}
                {t.dueDate ? ` — due ${new Date(t.dueDate).toLocaleDateString()}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '1rem 1.1rem',
}

const label: CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  marginBottom: 6,
}

const score: CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#0f172a',
}

const meta: CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  marginTop: 8,
}
