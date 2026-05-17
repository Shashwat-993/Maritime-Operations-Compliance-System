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
  Cell,
} from 'recharts'

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--color-text-faint)'
  if (score >= 80) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function fmtScore(score: number | null): string {
  return score === null ? 'n/a' : `${score.toFixed(1)}%`
}

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
    return (
      <div className="card alert-empty">
        Select a ship (admin) or ensure your user is assigned to a vessel.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="stack">
        <h1>Dashboard</h1>
        <div className="grid-cards">
          <div className="card skeleton" style={{ height: 110 }} />
          <div className="card skeleton" style={{ height: 110 }} />
          <div className="card skeleton" style={{ height: 110 }} />
          <div className="card skeleton" style={{ height: 110 }} />
          <div className="card skeleton" style={{ height: 110 }} />
        </div>
        <div className="card skeleton" style={{ height: 260 }} />
        <div className="card skeleton" style={{ height: 120 }} />
        <div className="card skeleton" style={{ height: 120 }} />
      </div>
    )
  }
  if (error || !data) return <div className="alert alert-error">Could not load compliance.</div>

  const chartData = [
    { name: 'Maintenance', value: data.maintenanceScore ?? 0, score: data.maintenanceScore },
    { name: 'Drills', value: data.drillScore ?? 0, score: data.drillScore },
  ]

  const maintenanceAccent =
    data.maintenanceScore !== null && data.maintenanceScore < 50
      ? 'card card-accent-danger'
      : data.maintenanceScore !== null && data.maintenanceScore < 80
      ? 'card card-accent-warning'
      : 'card card-accent'
  const drillAccent =
    data.drillScore !== null && data.drillScore < 50
      ? 'card card-accent-danger'
      : data.drillScore !== null && data.drillScore < 80
      ? 'card card-accent-warning'
      : 'card card-accent'

  return (
    <div className="stack">
      <div>
        <h1>Dashboard</h1>
        <p className="muted text-sm" style={{ marginTop: 4 }}>
          Compliance summary for the selected ship.
        </p>
      </div>

      <div className="grid-cards">
        <div className={maintenanceAccent}>
          <div className="card-label">Maintenance compliance</div>
          <div className="card-value" style={{ color: scoreColor(data.maintenanceScore) }}>
            {fmtScore(data.maintenanceScore)}
          </div>
          <div className="card-meta">
            {data.counts.tasksCompleted} of {data.counts.tasksTotal} tasks completed
          </div>
        </div>
        <div className={drillAccent}>
          <div className="card-label">Drill compliance</div>
          <div className="card-value" style={{ color: scoreColor(data.drillScore) }}>
            {fmtScore(data.drillScore)}
          </div>
          <div className="card-meta">
            {data.counts.attendanceAttended} attended of {data.counts.attendanceMarked} marked ·{' '}
            {data.counts.drillsTotal} drills total
          </div>
        </div>
        <div className={data.counts.tasksPending > 0 ? 'card card-accent-warning' : 'card card-accent'}>
          <div className="card-label">Pending maintenance</div>
          <div
            className="card-value"
            style={{
              color: data.counts.tasksPending > 0 ? 'var(--color-warning)' : 'var(--color-success)',
            }}
          >
            {data.counts.tasksPending}
          </div>
          <div className="card-meta">
            {data.counts.tasksPending === 0
              ? 'Nothing waiting'
              : `Open across ${data.counts.tasksTotal} tracked tasks`}
          </div>
        </div>
        <div className={data.overdue.length > 0 ? 'card card-accent-danger' : 'card card-accent'}>
          <div className="card-label">Overdue tasks</div>
          <div
            className="card-value"
            style={{
              color: data.overdue.length > 0 ? 'var(--color-danger)' : 'var(--color-success)',
            }}
          >
            {data.overdue.length}
          </div>
          <div className="card-meta">
            {data.overdue.length === 0 ? 'All on track' : 'Need attention now'}
          </div>
        </div>
        <div className={data.counts.drillsMissed > 0 ? 'card card-accent-danger' : 'card card-accent'}>
          <div className="card-label">Missed drills</div>
          <div
            className="card-value"
            style={{
              color: data.counts.drillsMissed > 0 ? 'var(--color-danger)' : 'var(--color-success)',
            }}
          >
            {data.counts.drillsMissed}
          </div>
          <div className="card-meta">
            {data.counts.drillsMissed === 0
              ? 'No drills missed'
              : 'Past their date with no attendance'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-label">Scores overview</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 16, right: 16, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              unit="%"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <Tooltip
              formatter={(_v: number, _n, p) => [fmtScore(p.payload.score), 'Score']}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontSize: 13,
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={scoreColor(d.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={data.overdue.length > 0 ? 'card card-accent-danger' : 'card'}>
        <div className="card-label">Overdue maintenance</div>
        {data.overdue.length === 0 ? (
          <p className="muted">No overdue tasks. </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {data.overdue.map((t) => (
              <li key={t.id} style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{t.title}</span>
                {t.dueDate && (
                  <span className="muted text-sm">
                    {' '}
                    — due {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={data.missedDrills.length > 0 ? 'card card-accent-danger' : 'card'}>
        <div className="card-label">Missed drills</div>
        {data.missedDrills.length === 0 ? (
          <p className="muted">No drills missed.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {data.missedDrills.map((d) => (
              <li key={d.id} style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{d.type}</span>
                <span className="muted text-sm">
                  {' '}— scheduled {new Date(d.scheduledDate).toLocaleDateString()}, no attendance recorded
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
