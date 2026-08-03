import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import {
  ErrorMessage,
  Field,
  FieldGroup,
  Heading,
  Input,
  Label,
  Text,
} from './catalyst'
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

        <Heading id="auth-title" className="!text-[1.65rem]">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </Heading>
        <Text className="mt-2">
          Your workspace syncs to the cloud. Sign in to open tasks, side
          projects, clients, and payments.
        </Text>

        <form className="mt-8" onSubmit={onSubmit}>
          <FieldGroup>
            {mode === 'signup' && (
              <Field>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </Field>
            )}
            <Field>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>
            <Field>
              <Label>Password</Label>
              <Input
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
            </Field>
          </FieldGroup>

          {error && (
            <ErrorMessage className="mt-4" role="alert">
              {error}
            </ErrorMessage>
          )}

          <Button type="submit" className="mt-8 w-full" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        <Text className="mt-6">
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
        </Text>
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
