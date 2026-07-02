# StealthEra RPM — Backend

Express + TypeScript API. Layered: `routes → controllers → services → repositories →
models`. MongoDB via Mongoose, Zod validation, JWT (clinicians) + `X-API-Key` (devices).

## Setup

```bash
cp .env.example .env      # set MONGODB_URI, JWT_SECRET, DEVICE_API_KEYS
npm install
npm run seed              # sample patients + packets + alerts + admin user
npm run dev               # http://localhost:4000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | run with hot reload (tsx watch) |
| `npm start` | run once (tsx) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | compile to `dist/` |
| `npm run seed` | reset + load `sample-data/` |

## Docs

- Swagger UI: http://localhost:4000/docs
- Raw spec: `openapi.yaml` (also at `/openapi.yaml`)
- Postman: `postman_collection.json` (Login request auto-saves the JWT)

## Auth

- **Devices** send `X-API-Key: <one of DEVICE_API_KEYS>` to `POST /health-data`.
- **Clinicians** `POST /auth/login` → JWT → `Authorization: Bearer <token>` for
  `/patients/*` and `/patient-profile/*`.
- Set `AUTH_ENABLED=false` to open all routes for local exploration.

## Layout

```
src/
  config/         env + physiological bounds
  db/             mongoose connection + models
  middleware/     auth, deviceAuth, validate, errors, logging
  validation/     zod schemas
  repositories/   data access
  services/       ingestion, alert engine, recovery, patient, genetics, profile, auth
  controllers/    thin request handlers
  routes/         express routers (mounted at /api/v1)
  docs/           openapi loader
  scripts/        seed
  app.ts          express factory
  server.ts       entrypoint
```

## Error Shape

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

Status codes: `201` stored · `200` duplicate · `400/422` invalid · `401` unauthenticated
· `404` unknown patient · `502` partner unavailable.
