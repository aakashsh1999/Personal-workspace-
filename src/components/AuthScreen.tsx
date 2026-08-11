import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { Button } from './ui'

export function AuthScreen() {
  const { signIn, signUp, error, clearError } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    clearError()
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name)
      } else {
        await signIn(email.trim(), password)
      }
    } catch {
      // error shown via context
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen-card" role="main">
        <div className="auth-brand">
          <div className="brand-mark" aria-hidden>
            <span />
          </div>
          <div>
            <div className="brand-name">Orbit</div>
            <div className="brand-sub">Sign in to continue</div>
          </div>
        </div>

        <h1
          id="auth-title"
          className="m-0 text-[1.65rem] font-semibold tracking-tight text-zinc-950"
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 mb-0 text-sm text-zinc-500">
          Your workspace syncs to the cloud. Sign in to open tasks, side
          projects, clients, and payments.
        </p>

        <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
          {mode === 'signup' && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-950">
              Name
              <input
                className="rounded-xl border border-zinc-950/10 bg-white px-3.5 py-2.5 text-sm font-normal text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-950">
            Email
            <input
              type="email"
              required
              className="rounded-xl border border-zinc-950/10 bg-white px-3.5 py-2.5 text-sm font-normal text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-950">
            Password
            <input
              type="password"
              required
              minLength={6}
              className="rounded-xl border border-zinc-950/10 bg-white px-3.5 py-2.5 text-sm font-normal text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <p
              className="m-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 mb-0 text-sm text-zinc-500">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  clearError()
                  setMode('signup')
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  clearError()
                  setMode('signin')
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export function AuthLoading() {
  return (
    <div className="auth-screen" role="status" aria-live="polite">
      <div className="auth-screen-card auth-loading-card">
        <div className="brand-mark" aria-hidden>
          <span />
        </div>
        <p>Checking your account…</p>
      </div>
    </div>
  )
}
