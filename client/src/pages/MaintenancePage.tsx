import { Fragment, FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CrewMember, MaintenanceTask, TaskComment, TaskStatus } from '../api/types'
import { useShipScope } from '../hooks/useShipScope'
import { useAuth } from '../context/AuthContext'

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function ErrorBanner({ message }: { message: string }) {
  return <div className="alert alert-error">{message}</div>
}

function statusBadgeClass(s: TaskStatus): string {
  if (s === 'COMPLETED') return 'badge badge-completed'
  if (s === 'IN_PROGRESS') return 'badge badge-in-progress'
  return 'badge badge-pending'
}

function isOverdue(t: MaintenanceTask): boolean {
  return Boolean(t.dueDate) && new Date(t.dueDate!).getTime() < Date.now() && t.status !== 'COMPLETED'
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
    <div className="divider">
      <div className="card-label" style={{ marginBottom: 8 }}>
        Comments
      </div>
      {(task.comments ?? []).length === 0 && (
        <p className="muted text-sm" style={{ marginBottom: 6 }}>
          No comments yet.
        </p>
      )}
      {(task.comments ?? []).map((c: TaskComment) => (
        <div key={c.id} className="comment">
          <span className="comment-author">{c.user.name}:</span> {c.note}
          <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
        </div>
      ))}
      {user && (
        <form onSubmit={onSubmit} className="row" style={{ marginTop: 8 }}>
          <input
            className="input input-sm"
            placeholder="Add a comment…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={addComment.isPending || !note.trim()}
            className="btn btn-primary btn-sm"
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
  const [assignedTo, setAssignedTo] = useState('')
  const [formError, setFormError] = useState('')
  const [mutationError, setMutationError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')

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

  const { data: shipUsers } = useQuery({
    queryKey: ['ship-users', effectiveShipId],
    enabled: Boolean(effectiveShipId) && isAdmin,
    queryFn: async () => {
      const { data } = await api.get<CrewMember[]>('/api/users', { params: shipQuery })
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
        assigned_to: assignedTo || null,
        status: 'PENDING',
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setTitle('')
      setDescription('')
      setDueDate('')
      setAssignedTo('')
      setFormError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create task'
      setFormError(msg)
    },
  })

  const editTask = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('No task selected')
      await api.patch(`/api/tasks/${editingId}`, {
        title: editTitle,
        description: editDescription || null,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        assigned_to: editAssignedTo || null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['compliance'] })
      setEditingId(null)
      setMutationError('')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update task'
      setMutationError(msg)
    },
  })

  function startEdit(t: MaintenanceTask) {
    setEditingId(t.id)
    setEditTitle(t.title)
    setEditDescription(t.description ?? '')
    setEditDueDate(toLocalInput(t.dueDate))
    setEditAssignedTo(t.assignee?.id ?? '')
    setMutationError('')
  }

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
    return <div className="card alert-empty">Select a ship (admin) or ensure your user is assigned to a vessel.</div>
  }

  return (
    <div className="stack">
      <div>
        <h1>Maintenance</h1>
        <p className="muted text-sm" style={{ marginTop: 8 }}>
          Manage tasks and crew comments for this ship.
        </p>
      </div>

      <div className="card row" style={{ alignItems: 'flex-end' }}>
        <label className="field" style={{ minWidth: 160 }}>
          Status
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ minWidth: 180 }}>
          Due date (day)
          <input
            type="date"
            className="input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </label>
        {(statusFilter || dateFilter) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setStatusFilter('')
              setDateFilter('')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {isAdmin && (
        <form onSubmit={onCreate} className="card stack-sm" style={{ maxWidth: 520 }}>
          <h2>New task</h2>
          <label className="field">
            Title
            <input
              className="input"
              placeholder="e.g. Engine room inspection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </label>
          <label className="field">
            Description
            <textarea
              className="textarea"
              placeholder="Optional details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </label>
          <label className="field">
            Due date
            <input
              type="datetime-local"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className="field">
            Assign to
            <select
              className="select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {(shipUsers ?? [])
                .filter((u) => u.role === 'CREW')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
            </select>
          </label>
          {formError && <ErrorBanner message={formError} />}
          <button type="submit" disabled={createTask.isPending} className="btn btn-primary">
            {createTask.isPending ? 'Creating…' : 'Create task'}
          </button>
        </form>
      )}

      {mutationError && <ErrorBanner message={mutationError} />}

      {isLoading ? (
        <div className="card skeleton" style={{ height: 220 }} />
      ) : (
        <div className="card card-flush">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(tasks ?? []).map((t) => (
                  <Fragment key={t.id}>
                    {editingId === t.id ? (
                      <tr>
                        <td colSpan={5} style={{ background: 'var(--color-surface-alt)' }}>
                          <form
                            className="stack-sm"
                            onSubmit={(e) => {
                              e.preventDefault()
                              if (!editTitle.trim()) return
                              editTask.mutate()
                            }}
                          >
                            <label className="field">
                              Title
                              <input
                                className="input"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                maxLength={200}
                                required
                              />
                            </label>
                            <label className="field">
                              Description
                              <textarea
                                className="textarea"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                maxLength={2000}
                                rows={3}
                              />
                            </label>
                            <div className="row">
                              <label className="field" style={{ flex: 1, minWidth: 200 }}>
                                Due date
                                <input
                                  type="datetime-local"
                                  className="input"
                                  value={editDueDate}
                                  onChange={(e) => setEditDueDate(e.target.value)}
                                />
                              </label>
                              <label className="field" style={{ flex: 1, minWidth: 200 }}>
                                Assign to
                                <select
                                  className="select"
                                  value={editAssignedTo}
                                  onChange={(e) => setEditAssignedTo(e.target.value)}
                                >
                                  <option value="">Unassigned</option>
                                  {(shipUsers ?? [])
                                    .filter((u) => u.role === 'CREW')
                                    .map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.name} ({u.email})
                                      </option>
                                    ))}
                                </select>
                              </label>
                            </div>
                            <div className="row">
                              <button type="submit" disabled={editTask.isPending} className="btn btn-primary btn-sm">
                                {editTask.isPending ? 'Saving…' : 'Save changes'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="title-link"
                            onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)}
                          >
                            {expandedTask === t.id ? '▾' : '▸'} {t.title}
                          </button>
                          {t.description && <div className="task-description">{t.description}</div>}
                        </td>
                        <td>
                          <span className={statusBadgeClass(t.status)}>
                            {t.status.replace('_', ' ')}
                          </span>
                          {isOverdue(t) && (
                            <span className="badge badge-overdue" style={{ marginLeft: 6 }}>
                              Overdue
                            </span>
                          )}
                        </td>
                        <td>
                          {t.dueDate ? (
                            <span className={isOverdue(t) ? '' : 'muted'} style={{ fontSize: '0.85rem' }}>
                              {new Date(t.dueDate).toLocaleString()}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {t.assignee?.name ?? <span className="muted">Unassigned</span>}
                        </td>
                        <td>
                          <div className="row" style={{ gap: 6 }}>
                            <select
                              className="select select-sm"
                              value={t.status}
                              onChange={(e) =>
                                patchStatus.mutate({ id: t.id, status: e.target.value as TaskStatus })
                              }
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => startEdit(t)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => {
                                    if (confirm(`Delete "${t.title}"?`)) deleteTask.mutate(t.id)
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {expandedTask === t.id && editingId !== t.id && (
                      <tr>
                        <td colSpan={5} style={{ background: 'var(--color-surface-alt)' }}>
                          <CommentsPanel task={t} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {(tasks ?? []).length === 0 && <div className="alert-empty">No tasks found.</div>}
        </div>
      )}
    </div>
  )
}
