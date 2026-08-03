import { Check, LogOut, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useStore } from '../store';

const STATUS_LABEL: Record<
  'local' | 'syncing' | 'synced' | 'error',
  string
> = {
  local: 'Connecting to cloud',
  syncing: 'Saving…',
  synced: 'Saved',
  error: 'Cloud save failed',
};

export function AuthControls({
  syncStatus,
}: {
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
}) {
  const { user, logOut } = useAuth();
  const { syncError } = useStore();

  if (!user) return null;

  const label =
    syncStatus === 'error' && syncError
      ? syncError
      : STATUS_LABEL[syncStatus];

  return (
    <>
      <span className="auth-user" title={user.email ?? undefined}>
        {user.displayName || user.email}
      </span>
      <span
        className={`topbar-save topbar-save--icon topbar-save--${syncStatus}`}
        title={label}
        aria-label={label}
        role="status"
      >
        {(syncStatus === 'syncing' || syncStatus === 'local') && (
          <span className="sync-loader" aria-hidden />
        )}
        {syncStatus === 'synced' && (
          <Check size={14} strokeWidth={3} aria-hidden />
        )}
        {syncStatus === 'error' && <X size={14} strokeWidth={3} aria-hidden />}
      </span>
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
