import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Drill, DrillType } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'
import { useAuth } from '../context/AuthContext'

const TYPES: DrillType[] = ['FIRE', 'EVACUATION', 'MOB']

function ErrorBanner({ message }: { message: string }) {
  return <div className="alert alert-error">{message}</div>
}

function drillBadgeClass(t: DrillType): string {
  if (t === 'FIRE') return 'badge badge-fire'
  if (t === 'EVACUATION') return 'badge badge-evacuation'
  return 'badge badge-mob'
}

export function DrillsPage() {
  const { user } = useAuth()
  const { effectiveShipId, shipQuery, isAdmin } = useShipScope()
  const qc = useQueryClient()
  const [dateFilter, setDateFilter] = useState('')
  const [type, setType] = useState<DrillType>('FIRE')
  const [scheduled, setScheduled] = useState('')
  const [formError, setFormError] = useState('')
  const [mutationError, setMutationError] = useState('')

  const { data: drills, isLoading } = useQuery({
    queryKey: ['drills', effectiveShipId, dateFilter],
    enabled: Boolean(effectiveShipId),
    queryFn: async () => {
      const { data } = await api.get<Drill[]>('/api/drills', {
        params: {
          ...shipQuery,
          ...(dateFilter ? { date: dateFilter } : {}),
        },
      })
      return data
    },
  })

  const createDrill = useMutation({
    mutationFn: async () => {
      if (!effectiveShipId || !scheduled) throw new Error('Missing fields')
      await api.post('/api/drills', {
        ship_id: effectiveShipId,
        type,
        scheduled_date: new Date(scheduled).toISOString(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drills'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setScheduled('')
      setFormError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create drill'
      setFormError(msg)
    },
  })

  const attend = useMutation({
    mutationFn: async ({ id, attended }: { id: string; attended: boolean }) => {
      await api.post(`/api/drills/${id}/attend`, { attended })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drills'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setMutationError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to record attendance'
      setMutationError(msg)
    },
  })

  const deleteDrill = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/drills/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drills'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setMutationError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to delete drill'
      setMutationError(msg)
    },
  })

  function onCreate(e: FormEvent) {
    e.preventDefault()
    createDrill.mutate()
  }

  if (!effectiveShipId) {
    return <div className="card alert-empty">Select a ship (admin) or ensure your user is assigned to a vessel.</div>
  }

  return (
    <div className="stack">
      <div>
        <h1>Drills</h1>
        <p className="muted text-sm" style={{ marginTop: 4 }}>
          Schedule safety drills and log crew attendance.
        </p>
      </div>

      <div className="card row" style={{ alignItems: 'flex-end' }}>
        <label className="field" style={{ minWidth: 200 }}>
          Scheduled day filter
          <input
            type="date"
            className="input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </label>
        {dateFilter && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDateFilter('')}>
            Clear filter
          </button>
        )}
      </div>

      {isAdmin && (
        <form onSubmit={onCreate} className="card stack-sm" style={{ maxWidth: 520 }}>
          <h2>Schedule drill</h2>
          <label className="field">
            Type
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as DrillType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Scheduled date
            <input
              type="datetime-local"
              className="input"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              required
            />
          </label>
          {formError && <ErrorBanner message={formError} />}
          <button type="submit" disabled={createDrill.isPending} className="btn btn-primary">
            {createDrill.isPending ? 'Scheduling…' : 'Create drill'}
          </button>
        </form>
      )}

      {mutationError && <ErrorBanner message={mutationError} />}

      {isLoading ? (
        <div className="card skeleton" style={{ height: 180 }} />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
          {(drills ?? []).length === 0 && (
            <li className="card alert-empty">No drills found.</li>
          )}
          {(drills ?? []).map((d) => {
            const mine = user ? d.attendance.find((a) => a.userId === user.id) : undefined
            const attendedCount = d.attendance.filter((a) => a.attended).length
            return (
              <li key={d.id} className="card card-interactive">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stack-sm" style={{ gap: 4 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={drillBadgeClass(d.type)}>{d.type}</span>
                      <strong>{new Date(d.scheduledDate).toLocaleString()}</strong>
                    </div>
                    <div className="muted text-sm">
                      Attendance: {d.attendance.length} recorded
                      {d.attendance.length > 0 && ` · ${attendedCount} attended`}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (confirm(`Delete this ${d.type} drill?`)) deleteDrill.mutate(d.id)
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                {user && (
                  <div className="row" style={{ marginTop: 'var(--space-3)', gap: 8 }}>
                    <span className="text-sm muted">Your status:</span>
                    <button
                      type="button"
                      className={`btn btn-sm btn-success-outline${mine?.attended ? ' is-active' : ''}`}
                      onClick={() => attend.mutate({ id: d.id, attended: true })}
                    >
                      Attended
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-danger-outline${
                        mine && !mine.attended ? ' is-active' : ''
                      }`}
                      onClick={() => attend.mutate({ id: d.id, attended: false })}
                    >
                      Did not attend
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
