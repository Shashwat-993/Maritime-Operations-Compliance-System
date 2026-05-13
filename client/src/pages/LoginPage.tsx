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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          padding: '1.5rem',
          borderRadius: 12,
          boxShadow: '0 8px 30px rgb(15 23 42 / 8%)',
          border: '1px solid #e2e8f0',
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: '1.35rem' }}>Sign in</h1>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{ display: 'block', width: '100%', marginTop: 6, padding: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ display: 'block', width: '100%', marginTop: 6, padding: '0.5rem' }}
          />
        </label>
        {error && (
          <p style={{ color: '#b91c1c', fontSize: 14, marginTop: 0 }} role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.6rem',
            marginTop: 8,
            background: '#0369a1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 16, marginBottom: 0 }}>
          Demo: <code>admin@example.com</code> / <code>crew@example.com</code> — password{' '}
          <code>password123</code>
        </p>
      </form>
    </div>
  )
}
