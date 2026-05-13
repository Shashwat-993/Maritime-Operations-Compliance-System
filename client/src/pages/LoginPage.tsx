import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { token, login, loading } = useAuth()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>
  if (token) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <form onSubmit={onSubmit} className="auth-card stack-sm">
        <div>
          <h1 className="auth-title">Maritime Operations</h1>
          <p className="auth-subtitle">Sign in to manage tasks, drills, and compliance.</p>
        </div>
        <label className="field">
          Email
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%' }}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="auth-hint">
          Demo: <code>admin@example.com</code> · <code>crew@example.com</code> — password{' '}
          <code>password123</code>
        </p>
      </form>
    </div>
  )
}
