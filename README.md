# StealthEra — Remote Patient Monitoring Platform

A simplified cloud-native RPM backend + dashboard. Wearable devices push physiological
signals; the backend validates, stores, alerts, and merges them with an external
genetic-risk partner. A React/Redux dashboard visualises everything.

- **Backend** — Node.js, Express, TypeScript, MongoDB (Mongoose), Zod validation, JWT + device API-key auth, OpenAPI/Swagger.
- **Frontend** — React, Vite, TypeScript, Redux Toolkit.
- **Docs** — [Architecture](docs/architecture.md) · [Database Design](docs/database-design.md) · OpenAPI at `/docs` · [Postman](backend/postman_collection.json).

## Repository Layout

```
newrepo/
├── backend/           Express + TS API (routes → controllers → services → repositories → models)
│   ├── src/
│   ├── sample-data/   seed data (patients + wearable packets)
│   ├── openapi.yaml   API specification (served at /docs)
│   └── postman_collection.json
├── frontend/          React + Redux Toolkit dashboard
├── docs/              architecture + database design
└── docker-compose.yml mongo + backend + frontend
```

## Quick Start (Docker)

```bash
docker compose up --build
docker compose exec backend npm run seed
```

- Dashboard → http://localhost:5173  (login `admin@stealthera.health` / `StealthEra`)
- API → http://localhost:4000/api/v1
- API docs → http://localhost:4000/docs

## Quick Start (Local)

Requires Node 20+ and a running MongoDB.

```bash
# backend
cd backend
cp .env.example .env
npm install
npm run seed        # loads sample patients, packets, alerts, admin user
npm run dev         # http://localhost:4000

# frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

## API Summary

| Method | Path | Auth | Task |
|---|---|---|---|
| POST | `/api/v1/health-data` | `X-API-Key` | 2 — device ingestion |
| GET | `/api/v1/patients/:id/latest` | Bearer | 3 |
| GET | `/api/v1/patients/:id/history` | Bearer | 3 |
| GET | `/api/v1/patients/:id/summary` | Bearer | 3 |
| GET | `/api/v1/genetics/:patientId` | — | 5 — partner mock |
| GET | `/api/v1/patient-profile/:id` | Bearer | 5 — merged profile |
| POST | `/api/v1/auth/login` | — | authentication |
| GET | `/api/v1/patients` | Bearer | dashboard list |

## Task 4 — Intelligence Layer (Alert Engine + Recovery Score)

The **alert engine** runs on every newly-stored packet and evaluates independent rules,
each producing a typed alert with a severity that escalates as the value gets further
from the threshold:

| Alert | Rule (default) | Escalates to `critical` |
|---|---|---|
| `HIGH_HEART_RATE` | `heartRate > 120` | `> 150` |
| `LOW_HEART_RATE` | `heartRate < 45` | — |
| `LOW_SPO2` | `spo2 < 92` | `< 87` |
| `HIGH_TEMPERATURE` | `temperature > 38.0` | `> 39.5` |
| `LOW_TEMPERATURE` | `temperature < 35.0` | — |
| `FALL_DETECTED` | `fallDetected == true` | always |

All thresholds are configurable via environment variables. The **recovery score**
(0–100, surfaced in the summary) is a transparent composite: it starts at 100 and
deducts bounded penalties for heart rate outside the resting band, sub-optimal SpO₂,
temperature deviation, and recent critical alerts — then maps to a band
(`poor`/`fair`/`good`/`excellent`).

## Bonus Answers

**Bonus 1 — duplicate packets.** `health_data` has a **unique index on
`(deviceId, timestamp)`**. Ingestion inserts and catches the duplicate-key error; a
repeat packet returns **`200 duplicate`** (not `201`) and creates no second row or
alert. A device could also send a client-generated `eventId` for the same guarantee —
the natural key is used here because `(deviceId, timestamp)` is already unique per reading.

**Bonus 2 — impossible values (HR 255, SpO₂ 12 %, Temp 72 °C).** Validation is
two-tier. **Hard physiological bounds** (HR 20–240, SpO₂ 50–100, Temp 30–45) reject
impossible readings with **`422`** — they are sensor faults, not emergencies, and
must never pollute averages or fire false alarms. Values that are *plausible but
dangerous* (e.g. HR 165, SpO₂ 84) pass validation and raise **critical alerts**. The
split lives in `config/vitals.ts` (bounds) vs `config/env.ts` (clinical thresholds).

**Bonus 3 — 100 → 100,000 devices (no API contract change).** The API is versioned
and stateless, so it scales behind these evolutions without changing contracts:

- Run the API as **stateless replicas behind a load balancer** (JWT/API-key auth means
  no server session state).
- Put a **durable queue (Kafka/SQS)** between ingestion and persistence; the endpoint
  becomes an append that returns immediately, and workers write + evaluate alerts.
- **Shard MongoDB on `deviceId`** and/or move `health_data` to a time-series collection;
  reads are already single-patient + indexed.
- Add **read replicas + a cache** for hot summaries, and precompute rollups.
- The genetics client already uses **timeouts + caching**, so partner latency does not
  block ingestion.

## Deliverables Map

- README — this file · **Architecture** — [docs/architecture.md](docs/architecture.md)
- Backend source — [backend/](backend/) · Frontend — [frontend/](frontend/)
- API docs — [backend/openapi.yaml](backend/openapi.yaml) + `/docs`, [Postman](backend/postman_collection.json)
- Database schema — [docs/database-design.md](docs/database-design.md) + Mongoose models in [backend/src/db/models](backend/src/db/models)
- Sample data — [backend/sample-data/](backend/sample-data/)
