import type { CSSProperties } from 'react'
import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { MaintenanceTask, TaskStatus } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'
import { useAuth } from '../context/AuthContext'

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

export function MaintenancePage() {
  const { user } = useAuth()
  const { effectiveShipId, shipQuery, isAdmin } = useShipScope()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', effectiveShipId, statusFilter, dateFilter],
    enabled: Boolean(effectiveShipId),
    queryFn: async () => {
      const { data } = await api.get<MaintenanceTask[]>('/api/tasks', {
        params: {
          ...shipQuery,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(dateFilter ? { date: dateFilter } : {}),
        },
      })
      return data
    },
  })

  const createTask = useMutation({
    mutationFn: async () => {
      if (!effectiveShipId) throw new Error('No ship')
      await api.post('/api/tasks', {
        ship_id: effectiveShipId,
        title,
        description: description || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'PENDING',
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setTitle('')
      setDescription('')
      setDueDate('')
    },
  })

  const patchStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      await api.patch(`/api/tasks/${id}`, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
    },
  })

  function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createTask.mutate()
  }

  if (!effectiveShipId) {
    return <p>Select a ship (admin) or ensure your user is assigned to a vessel.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 style={{ margin: 0 }}>Maintenance</h1>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 14 }}>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginLeft: 8, padding: '0.35rem' }}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 14 }}>
          Due date (day)
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ marginLeft: 8, padding: '0.35rem' }}
          />
        </label>
      </div>

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
          <strong>New task</strong>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ padding: '0.5rem' }}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ padding: '0.5rem' }}
          />
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button
            type="submit"
            disabled={createTask.isPending}
            style={{
              padding: '0.5rem',
              background: '#0369a1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
            }}
          >
            Create task
          </button>
        </form>
      )}

      {isLoading ? (
        <p>Loading tasks…</p>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                <th style={th}>Title</th>
                <th style={th}>Status</th>
                <th style={th}>Due</th>
                <th style={th}>Assignee</th>
                {user && <th style={th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(tasks ?? []).map((t) => (
                <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={td}>{t.title}</td>
                  <td style={td}>{t.status}</td>
                  <td style={td}>{t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}</td>
                  <td style={td}>{t.assignee?.name ?? '—'}</td>
                  <td style={td}>
                    <select
                      value={t.status}
                      onChange={(e) =>
                        patchStatus.mutate({ id: t.id, status: e.target.value as TaskStatus })
                      }
                      style={{ padding: '0.25rem' }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th: CSSProperties = { padding: '0.65rem', fontWeight: 600 }
const td: CSSProperties = { padding: '0.65rem', verticalAlign: 'top' }
