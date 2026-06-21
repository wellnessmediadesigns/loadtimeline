# LoadTimeline

**Documentation Made Simple**
Professional Load Documentation — _A Product by Organized Freight_ ([OrganizedFreight.com](https://OrganizedFreight.com))

LoadTimeline helps truck drivers, owner-operators, dispatchers, and freight brokers create
accurate, timestamped documentation for every load — eliminating disputes over arrival/departure
times, detention, delays, damaged freight, shortages, seal issues, lumper fees, and rejected
deliveries. Record an event in one tap, build a clean timeline, and export a polished PDF.

Offline-first. No account. No login. No cloud. Everything stays on the device.

## Features

- **One-tap event logging** — Arrived, Checked In, At Dock, Loaded, Unloaded, Departed. Each event
  auto-captures date, time, and GPS (reverse-geocoded to a readable address).
- **Visual timeline** of every load.
- **Detention tracking** — Time On Site, Wait, Loading, Unloading, and Potential Detention with
  green / amber / red color coding.
- **Incident Center** — 11 incident types, severity, notes, GPS, and photos.
- **Local photo pipeline** — capture/pick, auto-compress, thumbnail, stored on-device (no cloud).
- **Professional PDF reports** — Organized Freight branded; share / email / print / save / export.
- **Searchable load history** with status filters.
- **Analytics dashboard** — loads, hours detained, incidents, reports, average facility time, top delay.
- **Light / Dark mode**, local JSON export/import & backup.
- **Free vs Pro** — Free up to 25 loads; Pro (one-time) unlocks unlimited loads/reports, advanced
  analytics, and premium report templates.

## Tech Stack

React Native · Expo (SDK 54) · TypeScript · Expo Router · SQLite (`expo-sqlite`) ·
`expo-location` · `expo-camera` / `expo-image-picker` / `expo-image-manipulator` ·
`expo-file-system` · `expo-print` + `expo-sharing` for PDFs. Offline-first; no backend.

## Project Structure

```
app/            Expo Router routes (onboarding, tabs, load flow, event/incident/report, paywall)
src/theme/      Brand palette, tokens, ThemeProvider (light/dark)
src/db/         SQLite client + migrations + query modules
src/store/      Persisted settings (theme, Pro flag, onboarding, report count)
src/lib/        gps, photos, detention, pdf, analytics, backup, format, limits
src/components/ Reusable UI (Button, Card, StatCard, EventButton, TimelineItem, ...)
src/types/      Domain types + display catalog (events/incidents)
```

## Getting Started

```bash
npm install            # uses .npmrc (legacy-peer-deps) for Expo's web deps
npx expo start         # then press "i" or scan the QR with Expo Go on iPhone
npm run typecheck      # tsc --noEmit
```

> **Device required for full features.** Camera, GPS, and PDF generation need a real iPhone
> (Expo Go) or a dev build — they don't run in a web preview.

## Notes for V1

- **Pro unlock is a local flag** (`src/store/settings.tsx`). Real StoreKit / `expo-in-app-purchases`
  should be wired once an Apple Developer account + EAS dev build are set up. See the `NOTE:`
  markers in `app/paywall.tsx`.
- Bundle identifier: `com.organizedfreight.loadtimeline` (see `app.json`).
- App icon/splash are brand-navy placeholders in `assets/` — replace with final artwork before release.
