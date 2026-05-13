import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Drill, DrillType } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'
import { useAuth } from '../context/AuthContext'

const TYPES: DrillType[] = ['FIRE', 'EVACUATION', 'MOB']

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: 8,
        padding: '0.6rem 0.9rem',
        color: '#b91c1c',
        fontSize: 14,
      }}
    >
      {message}
    </div>
  )
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
    return <p>Select a ship (admin) or ensure your user is assigned to a vessel.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ margin: 0 }}>Drills</h1>
      <label style={{ fontSize: 14 }}>
        Scheduled day filter
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ marginLeft: 8, padding: '0.35rem' }}
        />
      </label>

      {isAdmin && (
        <form
          onSubmit={onCreate}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '1rem',
            display: 'grid',
            gap: 10,
            maxWidth: 480,
          }}
        >
          <strong>Schedule drill</strong>
          <select value={type} onChange={(e) => setType(e.target.value as DrillType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
            required
          />
          {formError && <ErrorBanner message={formError} />}
          <button
            type="submit"
            disabled={createDrill.isPending}
            style={{
              padding: '0.5rem',
              background: '#0369a1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
            }}
          >
            {createDrill.isPending ? 'Scheduling…' : 'Create drill'}
          </button>
        </form>
      )}

      {mutationError && <ErrorBanner message={mutationError} />}

      {isLoading ? (
        <p>Loading drills…</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {(drills ?? []).length === 0 && (
            <li style={{ color: '#64748b', fontSize: 14 }}>No drills found.</li>
          )}
          {(drills ?? []).map((d) => {
            const mine = user ? d.attendance.find((a) => a.userId === user.id) : undefined
            return (
              <li
                key={d.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600 }}>
                    {d.type} — {new Date(d.scheduledDate).toLocaleString()}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete this ${d.type} drill?`)) deleteDrill.mutate(d.id)
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                  Attendance recorded: {d.attendance.length}
                  {d.attendance.length > 0 && (
                    <span style={{ marginLeft: 8 }}>
                      ({d.attendance.filter((a) => a.attended).length} attended)
                    </span>
                  )}
                </div>
                {user && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>Your status:</span>
                    <button
                      type="button"
                      onClick={() => attend.mutate({ id: d.id, attended: true })}
                      style={{
                        padding: '0.35rem 0.65rem',
                        background: mine?.attended ? '#15803d' : '#e2e8f0',
                        color: mine?.attended ? '#fff' : '#0f172a',
                        border: 'none',
                        borderRadius: 6,
                      }}
                    >
                      Attended
                    </button>
                    <button
                      type="button"
                      onClick={() => attend.mutate({ id: d.id, attended: false })}
                      style={{
                        padding: '0.35rem 0.65rem',
                        background: mine && !mine.attended ? '#b91c1c' : '#e2e8f0',
                        color: mine && !mine.attended ? '#fff' : '#0f172a',
                        border: 'none',
                        borderRadius: 6,
                      }}
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
