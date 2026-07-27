# Orbit

A Notion-style personal workspace for day-to-day tasks, learning, office work, career growth, habits, side projects, and custom trackers.

## Features

- **Home dashboard** — focus items, due today, learning & career snapshots, habit chips
- **Spaces** — Tasks, Learning, Career, Office, Side Project, Habits, Notes, custom boards
- **Side Project hub** — clients, projects (with budget), and payment tracking (UPI/bank/etc.)
- **Firebase Auth + Firestore** — sign-in required; workspace syncs to the cloud
- **Custom colors** — theme presets + primary/accent pickers
- **Cloud + local cache** — Firestore is source of truth when signed in; `localStorage` caches offline

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel
2. Framework preset: **Vite** (build `npm run build`, output `dist`)
3. Optional: add `VITE_FIREBASE_*` env vars (defaults are already in code)
4. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**, add:
   - `localhost`
   - your Vercel domain, e.g. `your-app.vercel.app`
5. Publish Firestore rules from `firestore.rules`

## Firebase setup (required once)

1. Open [Firebase Console](https://console.firebase.google.com/) → project `personal-workspace-f1a98`
2. **Authentication** → Sign-in method → enable **Email/Password**
3. **Firestore Database** → create database (production mode is fine)
4. **Firestore** → Rules → paste contents of `firestore.rules` → **Publish**
5. Ensure `.env.local` has your web app config (already created from your Firebase snippet)

## Run

```bash
npm install
npm run dev
```

Restart the dev server after changing `.env.local`.

## Build

```bash
npm run build
npm run preview
```
