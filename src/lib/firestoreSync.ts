import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { AppState } from '../types';
import { db } from './firebase';

export type CloudWorkspace = {
  pages: AppState['pages'];
  habits: AppState['habits'];
  clients: AppState['clients'];
  projects: AppState['projects'];
  payments: AppState['payments'];
  goals: AppState['goals'];
  theme: AppState['theme'];
  activePageId: AppState['activePageId'];
  sidebarCollapsed: AppState['sidebarCollapsed'];
  updatedAt?: unknown;
};

/** Firestore rejects `undefined` — omit it (do not convert to null). */
export function stripUndefined<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v === undefined ? undefined : v)),
  ) as T;
}

export function syncErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message: string }).message)
      : String(err);

  if (code === 'permission-denied') {
    return 'Permission denied. Publish Firestore rules for users/{userId}/**.';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Network issue reaching Firestore. Check connection and retry.';
  }
  if (code === 'failed-precondition' || message.includes('the client is offline')) {
    return 'Firestore not ready. Create the database in Firebase Console.';
  }
  if (code === 'invalid-argument') {
    return 'Invalid data for Firestore (often undefined fields). Try again.';
  }
  if (code === 'not-found') {
    return 'Firestore database missing. Create it in Firebase Console.';
  }
  return message || 'Cloud save failed.';
}

function workspaceRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'workspace');
}

export function toCloudPayload(state: AppState): CloudWorkspace {
  return stripUndefined({
    pages: state.pages ?? [],
    habits: state.habits ?? [],
    clients: state.clients ?? [],
    projects: state.projects ?? [],
    payments: state.payments ?? [],
    goals: state.goals ?? [],
    theme: state.theme ?? {
      preset: 'teal',
      primary: '#0f766e',
      accent: '#0369a1',
    },
    activePageId: state.activePageId ?? 'page-home',
    sidebarCollapsed: state.sidebarCollapsed ?? false,
  });
}

export async function loadWorkspace(uid: string): Promise<CloudWorkspace | null> {
  const snap = await getDoc(workspaceRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as CloudWorkspace;
}

export async function saveWorkspace(uid: string, state: AppState) {
  const payload = {
    ...toCloudPayload(state),
    updatedAt: serverTimestamp(),
  };
  await setDoc(workspaceRef(uid), payload, { merge: true });
}
