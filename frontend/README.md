# StealthEra RPM — Dashboard

React + Vite + TypeScript + Redux Toolkit clinician dashboard.

## Setup

```bash
cp .env.example .env      # VITE_API_BASE_URL, VITE_DEVICE_API_KEY
npm install
npm run dev               # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:4000`, so start the backend first.
Sign in with the seeded admin (`admin@stealthera.health` / `StealthEra`).

## Scripts

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Vite dev server                         |
| `npm run build`   | typecheck + production build to `dist/` |
| `npm run preview` | preview the production build            |

## State (Redux Toolkit)

```
src/store/
  index.ts                configureStore
  hooks.ts                typed useAppDispatch / useAppSelector
  slices/authSlice.ts     login thunk + JWT persistence
  slices/patientsSlice.ts patient list + detail (summary, history, profile)
  slices/ingestionSlice.ts device-simulator submissions
```

## Pages

- **Patients** — live list with latest vitals + last alert.
- **Patient detail** — vitals tiles, recovery score, HR trend, genetic risk, alerts, history.
- **Simulate Device** — posts a wearable packet and shows the alerts it triggers.
