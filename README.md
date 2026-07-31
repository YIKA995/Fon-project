# Sentinel Africa

**AI-assisted cybersecurity monitoring for networks, banking and enterprise infrastructure.**

Sentinel Africa is a full-stack security operations platform: assets across a network report
telemetry, a detection engine combining signature rules and statistical anomaly scoring turns that
telemetry into risk-scored alerts in real time, and analysts triage alerts into incidents from a
live dashboard. Edge sites with unreliable connectivity are covered by an offline-capable agent
that buffers events locally and syncs automatically once back online.

## Architecture

```
┌─────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│  Edge Agent │  HTTP  │   Sentinel Africa API │  SQL   │   PostgreSQL     │
│ (buffers    │ ─────▶ │  Express + Prisma      │ ─────▶ │   (Prisma)       │
│  offline)   │        │  - Auth (JWT, RBAC)    │        └─────────────────┘
└─────────────┘        │  - Detection engine    │
                        │  - REST API            │        ┌─────────────────┐
┌─────────────┐  WS/    │  - Socket.io           │◀──────▶│   React Client   │
│  Browser    │ REST    └──────────────────────┘         │  Vite + Tailwind │
│  Dashboard  │ ──────────────────────────────────────▶  │  Recharts        │
└─────────────┘                                            │  Installable PWA │
                                                             └─────────────────┘
```

- **`server/`** — Node.js/Express REST API + Socket.io, PostgreSQL via Prisma. Owns auth, RBAC,
  the detection engine, alert/incident lifecycle, audit logging and real-time push.
- **`client/`** — React + TypeScript + Tailwind dashboard (Vite). Dark, SOC-style UI with live
  charts, alert triage, incident workflow, asset inventory, threat-intel management, user
  administration and an audit trail. Ships as an installable PWA with an offline-aware app shell.
- **`agent/`** — Lightweight Node.js edge collector. Meant to run at a branch, ATM cluster or
  monitored host; buffers telemetry to a durable local queue and flushes it to the API in batches,
  so monitoring keeps working through flaky or intermittent connectivity ("offline/online").

## Detection engine

Two layers feed a single 0–100 risk score per event (`server/src/services/detectionEngine.js`):

1. **Signature rules** — explainable, deterministic checks: brute-force login bursts, port
   scanning, SQL-injection/XSS/path-traversal payload patterns, and matches against a
   threat-intelligence list of known-bad IPs/domains/hashes.
2. **Statistical anomaly scoring** — a rolling mean/stddev baseline per asset + event type;
   events that deviate beyond a z-score threshold are flagged even with no matching signature.

Events scoring above the alert threshold automatically open an `Alert`, update the asset's risk
score/status, push a real-time notification over WebSocket, and fan out in-app notifications to
every Admin/Analyst.

## Quick start (Docker Compose)

```bash
docker compose up --build
```

This brings up PostgreSQL, the API (port 4000), the dashboard (port 5173) and a demo edge agent
generating synthetic telemetry. Then seed demo data:

```bash
docker compose exec server npm run seed
```

Open http://localhost:5173 and sign in with one of the demo accounts (password `Sentinel@2026`):

| Role    | Email                        |
|---------|-------------------------------|
| Admin   | admin@sentinelafrica.io       |
| Analyst | analyst@sentinelafrica.io     |
| Viewer  | viewer@sentinelafrica.io      |

## Manual development setup

Requires Node.js 20+ and a local PostgreSQL instance.

```bash
# 1. Database + API
cd server
cp .env.example .env         # edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev                  # http://localhost:4000

# 2. Dashboard (new terminal)
cd client
npm install
npm run dev                  # http://localhost:5173

# 3. Edge agent (optional, new terminal)
cd agent
cp .env.example .env
npm install
npm start
```

The first account ever registered via `/register` automatically becomes an Admin, so the platform
is self-bootstrapping without a seed step if you'd rather start from empty.

## API surface

All routes are namespaced under `/api` and JWT-protected unless noted. See `server/src/routes/`.

| Area          | Routes                                                       |
|---------------|----------------------------------------------------------------|
| Auth          | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `GET /auth/me` |
| Assets        | `GET/POST /assets`, `GET/PATCH/DELETE /assets/:id`            |
| Events        | `GET/POST /events`, `POST /events/ingest` (agent key), `POST /events/ingest/batch` |
| Alerts        | `GET /alerts`, `GET/PATCH /alerts/:id`                        |
| Incidents     | `GET/POST /incidents`, `GET/PATCH /incidents/:id`, `POST /incidents/:id/notes` |
| Threat intel  | `GET/POST /threat-intel`, `DELETE /threat-intel/:id`          |
| Dashboard     | `GET /dashboard/summary`                                      |
| Users (admin) | `GET /users`, `PATCH /users/:id`                               |
| Audit (admin) | `GET /audit-logs`                                               |

Edge agents authenticate to the ingest endpoints with an `x-agent-key` header (see
`AGENT_API_KEYS` in `server/.env`) rather than a user session.

## Security notes

- Passwords hashed with bcrypt (12 rounds); JWT access tokens are short-lived, refresh tokens are
  rotated and revocable server-side.
- Role-based access control (Admin / Analyst / Viewer) enforced on every mutating route.
- All input validated with Zod before touching the database; Prisma parameterizes every query.
- Every state-changing action is written to an append-only audit log with actor, IP and metadata.
- Rate limiting on auth endpoints to slow credential-stuffing attempts against the platform itself.

## Repository layout

```
server/   Express API, Prisma schema/migrations, detection engine, seed data
client/   React dashboard (Vite, TypeScript, Tailwind, Recharts)
agent/    Offline-capable edge telemetry collector
docker-compose.yml
```
