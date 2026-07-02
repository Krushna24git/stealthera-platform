# Database Design 

## SQL vs NoSQL

**Choice: MongoDB (document store).**

RPM is a high-volume, append-heavy, time-series workload: every device writes a small
physiological packet on a fixed cadence, and reads are almost always scoped to a single
patient over a time window. That shape favours a document store:

- The wearable packet is a self-contained document; no joins are needed to store or
  read one sample.
- Vitals are naturally sparse (a packet may omit metrics). A flexible document schema
  avoids wide, mostly-null relational rows.
- Horizontal scaling for ingestion is first-class: MongoDB shards on a key
  (e.g. `deviceId`), which is exactly how this workload grows (Bonus 3).
- Aggregations (average HR/SpO₂, total steps) run in the database via the aggregation
  pipeline.

A relational database would also work; the trade-off we accept is application-enforced
referential integrity between collections instead of foreign keys.

## Collections

| Collection | Purpose | Key fields |
|---|---|---|
| `health_data` | one wearable packet | `deviceId`, `patientId`, `timestamp`, `heartRate`, `spo2`, `temperature`, `steps`, `fallDetected`, `ingestedAt` |
| `alerts` | rule-engine output per packet | `patientId`, `deviceId`, `type`, `severity`, `message`, `metric`, `value`, `threshold`, `timestamp` |
| `patients` | patient registry | `patientId` (unique), `name`, `sex`, `dateOfBirth`, `deviceIds[]` |
| `devices` | device registry | `deviceId` (unique), `patientId`, `firstSeen`, `lastSeen` |
| `genetic_profiles` | partner-mock source data | `patientId` (unique), `cardiacRisk`, `diabetesRisk` |
| `users` | clinician accounts | `email` (unique), `passwordHash`, `role` |

## Relationships

- `patients (1) ── (N) devices` via `devices.patientId`.
- `patients (1) ── (N) health_data` via `health_data.patientId`.
- `patients (1) ── (N) alerts` via `alerts.patientId`.
- `patients (1) ── (1) genetic_profiles` via `patientId`.

References are by business id (`patientId`, `deviceId`), not ObjectId, so device
firmware and partner systems share a stable key.

## Indexes

| Collection | Index | Reason |
|---|---|---|
| `health_data` | `{ deviceId: 1, timestamp: 1 }` **unique** | idempotency — blocks duplicate packets (Bonus 1) |
| `health_data` | `{ patientId: 1, timestamp: -1 }` | latest vitals + history + summary aggregation |
| `alerts` | `{ patientId: 1, timestamp: -1 }` | latest alert + recent-critical lookups |
| `patients` | `{ patientId: 1 }` unique | registry lookup |
| `devices` | `{ deviceId: 1 }` unique | registry lookup |
| `genetic_profiles` | `{ patientId: 1 }` unique | partner lookup |
| `users` | `{ email: 1 }` unique | login |
