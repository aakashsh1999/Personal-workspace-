import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';

export function AuthScreen() {
  const { signIn, signUp, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    clearError();
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name);
      } else {
        await signIn(email.trim(), password);
      }
    } catch {
      // error shown via context
    } finally {
      setBusy(false);
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

        <h1 id="auth-title" className="auth-heading">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="auth-lead">
          Your workspace syncs to the cloud. Sign in to open tasks, side
          projects, clients, and payments.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'signup' && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  clearError();
                  setMode('signup');
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
                  clearError();
                  setMode('signin');
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
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
  );
}
