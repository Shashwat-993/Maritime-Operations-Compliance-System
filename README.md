# Maritime Operations & Compliance System

Monorepo: **React + Vite + TypeScript** client, **Express + Prisma + PostgreSQL** API, JWT RBAC (ADMIN / CREW), maintenance tasks, drills, and computed compliance.

## Prerequisites

- Node.js 20+
- Docker (optional, for Postgres and full stack)

## Quick start (local dev)

1. Copy environment files:

   ```bash
   copy .env.example .env
   copy server\.env.example server\.env
   copy client\.env.example client\.env
   ```

2. Start Postgres:

   ```bash
   docker compose up -d db
   ```

3. Server:

   ```bash
   cd server
   npm install
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```

   API listens on `http://localhost:4000` by default.

4. Client (new terminal):

   ```bash
   cd client
   npm install
   npm run dev
   ```

   Open the Vite URL (e.g. `http://localhost:5173`). The dev server proxies `/api` to the backend.

## Seed users

After `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | ADMIN |
| crew@example.com | password123 | CREW (assigned to first ship) |

## Compliance API semantics

- **maintenanceScore**: `COMPLETED` tasks / total tasks × 100. If there are no tasks, the score is `null` (not `NaN`).
- **drillScore**: Count of `drill_attendance` rows with `attended = true` divided by number of drills for the ship × 100. If there are no drills, the score is `null`.
- **overdue**: Tasks where `due_date < now` and `status` is not `COMPLETED`.

## Docker (full stack)

```bash
docker compose up --build
```

- Client: port **3000** (production build served by `vite preview`)
- Server: port **4000**
- Postgres: **5432**

Run migrations against the compose database:

```bash
docker compose run --rm server npx prisma migrate deploy
docker compose run --rm server npm run db:seed
```

## API (beyond the core plan)

- `GET /api/ships` — list ships (**ADMIN** only); used by the UI ship selector.
- `GET /api/users?ship_id=` — crew roster for a ship (crew scope is implicit; admin must pass `ship_id`).

## Project layout

- `client/` — React app (`src/pages`, `src/components`, `src/api`)
- `server/` — Express API (`src/routes`, `src/middleware`, `prisma/`)
