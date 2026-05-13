import type { CSSProperties } from 'react'
import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { MaintenanceTask, TaskComment, TaskStatus } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'
import { useAuth } from '../context/AuthContext'

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

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

function CommentsPanel({ task }: { task: MaintenanceTask }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const addComment = useMutation({
    mutationFn: async () => {
      await api.post(`/api/tasks/${task.id}/comments`, { note: note.trim() })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setNote('')
      setError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to add comment'
      setError(msg)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    addComment.mutate()
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
        Comments
      </div>
      {(task.comments ?? []).length === 0 && (
        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#94a3b8' }}>No comments yet.</p>
      )}
      {(task.comments ?? []).map((c: TaskComment) => (
        <div
          key={c.id}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '0.4rem 0.65rem',
            marginBottom: 6,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600 }}>{c.user.name}: </span>
          {c.note}
          <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 11 }}>
            {new Date(c.createdAt).toLocaleString()}
          </span>
        </div>
      ))}
      {user && (
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            placeholder="Add a comment…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            style={{ flex: 1, padding: '0.35rem', fontSize: 13 }}
          />
          <button
            type="submit"
            disabled={addComment.isPending || !note.trim()}
            style={{
              padding: '0.35rem 0.65rem',
              background: '#0369a1',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            Send
          </button>
        </form>
      )}
      {error && <ErrorBanner message={error} />}
    </div>
  )
}

export function MaintenancePage() {
  const { effectiveShipId, shipQuery, isAdmin } = useShipScope()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [formError, setFormError] = useState('')
  const [mutationError, setMutationError] = useState('')

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
      setFormError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create task'
      setFormError(msg)
    },
  })

  const patchStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      await api.patch(`/api/tasks/${id}`, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setMutationError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update task status'
      setMutationError(msg)
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tasks/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setMutationError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to delete task'
      setMutationError(msg)
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
            maxLength={200}
            required
            style={{ padding: '0.5rem' }}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            style={{ padding: '0.5rem' }}
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          {formError && <ErrorBanner message={formError} />}
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
            {createTask.isPending ? 'Creating…' : 'Create task'}
          </button>
        </form>
      )}

      {mutationError && <ErrorBanner message={mutationError} />}

      {isLoading ? (
        <p>Loading tasks…</p>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                <th style={th}>Title</th>
                <th style={th}>Status</th>
                <th style={th}>Due</th>
                <th style={th}>Assignee</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(tasks ?? []).map((t) => (
                <>
                  <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={td}>
                      <button
                        type="button"
                        onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                          fontWeight: 500,
                          color: '#0369a1',
                          fontSize: 'inherit',
                        }}
                      >
                        {expandedTask === t.id ? '▾' : '▸'} {t.title}
                      </button>
                      {t.description && (
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td style={td}>{t.status}</td>
                    <td style={td}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}
                    </td>
                    <td style={td}>{t.assignee?.name ?? '—'}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete "${t.title}"?`)) deleteTask.mutate(t.id)
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
                    </td>
                  </tr>
                  {expandedTask === t.id && (
                    <tr key={`${t.id}-comments`} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td colSpan={5} style={{ padding: '0.5rem 0.65rem' }}>
                        <CommentsPanel task={t} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {(tasks ?? []).length === 0 && (
            <p style={{ padding: '0.75rem', color: '#64748b', fontSize: 14 }}>No tasks found.</p>
          )}
        </div>
      )}
    </div>
  )
}

const th: CSSProperties = { padding: '0.65rem', fontWeight: 600 }
const td: CSSProperties = { padding: '0.65rem', verticalAlign: 'top' }
