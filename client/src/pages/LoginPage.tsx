import { FormEvent, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const isDev = import.meta.env.DEV

type DemoAccount = {
  name: string
  initials: string
  title: string
  email: string
  role: 'admin' | 'crew'
}

const demoAccounts: DemoAccount[] = [
  {
    name: 'Captain Nipun Chatrath',
    initials: 'NC',
    title: 'Administrator',
    email: 'admin@fathommarine.com',
    role: 'admin',
  },
  {
    name: 'Shashwat Pal',
    initials: 'SP',
    title: 'Chief Engineer',
    email: 'crew@fathommarine.com',
    role: 'crew',
  },
]

const features: { paths: string[]; label: string }[] = [
  {
    paths: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'],
    label: 'Ship Maintenance & Operational Activities',
  },
  {
    paths: [
      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
      'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      'M23 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    label: 'Safety Drill Coordination & Crew Management',
  },
  {
    paths: [
      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      'M9 12l2 2 4-4',
    ],
    label: 'Compliance Monitoring & Risk Assessment',
  },
]

export function LoginPage() {
  const { token, login, loading } = useAuth()
  const [email, setEmail] = useState(isDev ? demoAccounts[0].email : '')
  const [password, setPassword] = useState(isDev ? 'password123' : '')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(isDev ? demoAccounts[0].email : null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>
  if (token) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('Network error — check your connection and try again.')
        } else if (err.response.status === 401 || err.response.status === 400) {
          setError('Invalid email or password.')
        } else if (err.response.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else {
          setError('Sign-in failed. Please try again.')
        }
      } else {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function selectDemoAccount(account: DemoAccount) {
    setEmail(account.email)
    setPassword('password123')
    setSelectedDemo(account.email)
    setError(null)
  }

  return (
    <div className="auth-shell">
     <div className="auth-card">
      <section className="auth-brand-panel" aria-label="Fathom Marine Consultants overview">
        <div className="auth-rings auth-rings-top" aria-hidden="true" />
        <div className="auth-rings auth-rings-main" aria-hidden="true" />
        <div className="auth-rings auth-rings-small" aria-hidden="true" />

        <div className="auth-brand-top">
          <span className="auth-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v14" />
              <path d="M5 12H3a9 9 0 0 0 18 0h-2" />
              <path d="M9 19l3 2 3-2" />
            </svg>
          </span>
          <p className="auth-eyebrow">Fathom Marine Consultants</p>
          <h1 className="auth-brand-title">
            Maritime Operations<br />&amp; Compliance System
          </h1>
          <p className="auth-brand-lede">
            An all-in-one centralized and unified platform for —
          </p>
        </div>

        <ul className="auth-features" aria-label="Platform capabilities">
          {features.map((f) => (
            <li key={f.label} className="auth-feature">
              <span className="auth-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  {f.paths.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </svg>
              </span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="auth-form-panel" aria-label="Sign in">
        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-heading">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <label className="field auth-field">
            Email address
            <input
              type="email"
              name="email"
              className="input"
              placeholder="you@fathommarine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </label>

          <label className="field auth-field">
            Password
            <span className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-group-action auth-password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </span>
          </label>

          {error && (
            <div className="alert alert-error" role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary auth-submit">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          {isDev && (
            <div className="auth-demo" aria-label="Demo accounts">
              <div className="auth-demo-title">
                <span />
                <strong>Demo Accounts</strong>
                <span />
              </div>
              <div className="auth-demo-list">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className={`auth-demo-account${selectedDemo === account.email ? ' is-selected' : ''}`}
                    onClick={() => selectDemoAccount(account)}
                    aria-pressed={selectedDemo === account.email}
                  >
                    <span className={`auth-demo-avatar auth-demo-avatar-${account.role}`} aria-hidden="true">
                      {account.initials}
                    </span>
                    <span className="auth-demo-text">
                      <strong>{account.name}</strong>
                      <span>{account.title} · {account.email}</span>
                    </span>
                    <span className={`auth-demo-role auth-demo-role-${account.role}`}>{account.role}</span>
                  </button>
                ))}
              </div>
              <p className="auth-hint">Click a demo account to auto-fill, then press Sign In</p>
            </div>
          )}
        </form>
      </section>
     </div>
    </div>
  )
}
