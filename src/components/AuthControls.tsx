import { Cloud, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useStore } from '../store';

export function AuthControls({
  syncStatus,
}: {
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
}) {
  const { user, logOut } = useAuth();
  const { syncError } = useStore();

  if (!user) return null;

  return (
    <>
      <span className="auth-user" title={user.email ?? undefined}>
        {user.displayName || user.email}
      </span>
      <span
        className={`topbar-save topbar-save--${syncStatus}`}
        title={syncError ?? 'Cloud sync status'}
      >
        <Cloud size={14} aria-hidden />
        {syncStatus === 'syncing' && 'Saving…'}
        {syncStatus === 'synced' && 'Saved to cloud'}
        {syncStatus === 'error' && 'Cloud save failed'}
        {syncStatus === 'local' && 'Connecting…'}
      </span>
      {syncStatus === 'error' && syncError && (
        <span className="sync-error-hint" title={syncError}>
          {syncError}
        </span>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => void logOut()}
        aria-label="Sign out"
      >
        <LogOut size={15} aria-hidden />
        Sign out
      </button>
    </>
  );
}
