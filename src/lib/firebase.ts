import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase web config.
 * Vercel builds do not include `.env.local`, so defaults keep production working.
 * Set VITE_FIREBASE_* in Vercel to override.
 */
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDenDuB949XR1kCbrWBPzk68I13P6SnQ84',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'personal-workspace-f1a98.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || 'personal-workspace-f1a98',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'personal-workspace-f1a98.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '763081486084',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:763081486084:web:ff9bfe1e4e4ffa93ebaa51',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HY78LZCZBH',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

let analytics: Analytics | null = null;

export async function initAnalytics() {
  try {
    if (analytics) return analytics;
    if (typeof window === 'undefined') return null;
    if (!(await isSupported())) return null;
    analytics = getAnalytics(firebaseApp);
    return analytics;
  } catch (err) {
    console.warn('Analytics unavailable', err);
    return null;
  }
}
