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
 
## Submission checklist
Include the following artifacts in your submission repository:

- `BUSINESS_FLOW.md` (business flow / DOC): already present. Convert to PDF for the submission package.
- `README.md`: this file with setup steps and architecture decisions.
- Source code: full `client/` and `server/` folders.
- A deployable configuration (see `docker-compose.prod.yml` added to this repo).

## Export `BUSINESS_FLOW.md` to PDF
If you want a PDF file for submission, run locally:

```powershell
pandoc BUSINESS_FLOW.md -o BUSINESS_FLOW.pdf
```

Or open `BUSINESS_FLOW.md` in VS Code, open the Markdown preview and print to PDF.

## Production Docker Compose (example)
I've included a `docker-compose.prod.yml` sample in the repo. It shows how to run the server and client images with a managed Postgres instance.

## Create a GitHub repository and push
From the repo root:

```powershell
git init
git add .
git commit -m "Initial submission"
# create a repo on GitHub, then:
git remote add origin git@github.com:<your>/<repo>.git
git branch -M main
git push -u origin main
```

If you want I can create the remote and push for you (I will need a repo URL or a personal access token).

## Deploying (recommended: Render)
High-level steps for Render:

1. Create a new Postgres instance in Render (managed DB).
2. Create a Web Service for `server` using the `server/Dockerfile`.
3. Create a Web Service for `client` using the `client/Dockerfile` (or use Vercel for static hosting).
4. Configure environment variables (DATABASE_URL, JWT_SECRET, etc.) in Render dashboard.
5. Add a simple health check endpoint in the server and enable automatic deploys from GitHub.

## Next steps I can perform for you
- Convert `BUSINESS_FLOW.md` to `BUSINESS_FLOW.pdf` and add it to the repo.
- Create `render.yaml` / deployment manifest for Render.
- Create a GitHub repo and push the code (requires repo name or token).

Tell me which of these you want me to do next and I will proceed.
