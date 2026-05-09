# Timeline App

Interactive historical timeline with relationship mapping. Vue 3 SPA + Express
API + SQLite, served as a single Node container in production.

## Critical Rules

- **NEVER commit `data/timeline.db`** — gitignored. The dev DB is local-only.
  Production data lives at `/var/db/timeline/timeline.db` on timeline-lxc and
  never enters the image or the deploy artifact.
- **Never edit a live migration file under `server/migrations/`** after it has
  been pushed to main. Migrations are append-only — fix forward by writing a
  new one.
- **Never use `drizzle-kit push`** for production-bound changes. `push` skips
  the `__drizzle_migrations` ledger, so the next deploy will try to re-apply
  migrations and fail. Always run `npm run db:generate`, commit the SQL, and
  let the next deploy apply it on container start.

## Stack

- **Server:** Express 4 + TypeScript, compiled with `tsc` to `server/dist`,
  run with `node dist/index.js` in production.
- **Client:** Vue 3 + Vite SPA, built to `client/dist`. Served by the same
  Express container in production via `express.static` + an `app.get('*')`
  fallback for client-side routing.
- **Database:** SQLite (better-sqlite3) with WAL mode. Schema is authored as
  Drizzle ORM table definitions in `server/src/db/schema.ts`; migrations are
  generated with `drizzle-kit` and applied at server startup via
  `drizzle-orm/better-sqlite3/migrator`'s `migrate()`.
- **Logging:** pino → JSON to stdout in production, pino-pretty in dev.
  Promtail on the LXC scrapes Docker logs into Loki for query in Grafana.

### Drizzle hybrid mode

Timeline uses Drizzle for **schema authorship + migrations only**. Existing
service-layer queries in `server/src/services/*.service.ts` continue to use
raw `db.prepare(...)` from better-sqlite3 — they were not rewritten to the
Drizzle query builder. Both modes coexist on the same connection: `db` is
exported as a raw `Database`, and `initializeDatabase()` wraps it minimally
to call `migrate()`. New queries can choose either style; preserve this
boundary intentionally rather than mixing within a single service file.

The bridge migration `server/migrations/0000_goofy_spectrum.sql` was hand-edited
once to add `IF NOT EXISTS` clauses, so it is safe to apply against pre-Drizzle
dev databases without crashing. **Do not add `IF NOT EXISTS` to future
migrations** — that exception was a one-time bridge from the old raw-SQL
initialization path. Subsequent migrations should be normal Drizzle output.

## Development

```bash
npm install               # install all workspaces (server, client, shared)
npm run dev               # concurrently runs server (:3000) and Vite dev (:5173 with /api proxy)
npm run db:seed           # seed dev DB with sample events + relationships
npm run db:generate       # after editing schema.ts → produces a new migration SQL file
npm run lint
npm run typecheck
npm run test
```

## Deployment

**Live at <https://timeline.ichrisbirch.com>** behind Authelia ForwardAuth.
Pushes to `main` auto-deploy via GHA → ghcr.io → webhook → `docker compose pull && up`
on timeline-lxc (10.0.20.13 / CTID 113). See `~/homelab/containers/timeline-lxc/README.md`
for the LXC runbook.

Things to know when changing this repo:

- **Anything pushed to `main` ships within ~3 minutes.** No manual deploy step.
  Test locally before pushing, especially for changes that touch
  `server/src/db/`, `server/src/routes/`, or anything in the runtime hot path.
- **Database migrations apply on app startup** via Drizzle's migrator in
  `server/src/db/index.ts`. Workflow for a schema change: edit
  `server/src/db/schema.ts` → run `npm run db:generate` → commit the new SQL
  file in `server/migrations/` along with the schema change. The next deploy
  applies it automatically on container start.
- **Both `Dockerfile` stages must match local Node major version.** Currently
  `node:24-alpine`. If your local is on a different major, npm lockfile
  formats may diverge between npm 10 and 11 and CI will fail with `Missing:
<pkg>@<ver> from lock file`. When updating Node, update both Dockerfile
  stages together.
- **`package.json` and `package-lock.json` must be committed together.** CI
  uses `npm ci` which is strict about lockfile/manifest agreement.
- **Production DB lives at `/var/db/timeline/timeline.db` on the LXC**, never
  in the image. The bind mount survives every `docker compose up`. Local
  `data/timeline.db` is dev-only and gitignored.
- **Backups run nightly** via backup-lxc → NAS → Backblaze B2 (30-snapshot
  retention). Restore procedure documented in `~/homelab/docs/backups.md`.
  SQLite snapshots use `sqlite3 .backup` (not raw `cp`) to avoid torn-page
  issues with WAL.
- **`shared` workspace is type-only at runtime.** Every server import from
  `'shared'` is `import type { ... }`, so TypeScript erases it at emit. The
  Docker runtime image deliberately does not include `shared/` in its layout
  — only the compiled `server/dist/` and `client/dist/` plus pruned
  `node_modules/`.

## K8s readiness

Code is intentionally K8s-ready so the eventual k3s migration is a manifest
write, not a rewrite:

- `/api/health` — liveness probe target. Returns 200 OK when the server is
  responsive, regardless of DB state.
- `/api/ready` — readiness probe target. Pings the DB and returns 503 if it
  fails. Used by Docker compose healthcheck and k3s readinessProbe.
- All config is env-driven: `PORT`, `NODE_ENV`, `DATABASE_PATH`,
  `MIGRATIONS_FOLDER`, `LOG_LEVEL`, `STATIC_DIR`. No hardcoded paths.
- Single bind-mount for SQLite. Translates 1:1 to a `PersistentVolumeClaim`
  (ReadWriteOnce, single replica) when k3s comes online.
- SIGTERM handler does a 10s HTTP drain, closes the DB, exits 0. Pod
  termination won't lose in-flight requests or corrupt the DB.
- Structured JSON logs to stdout. No file sinks, no log rotation in-process.

When k3s exists, the migration is: write a `Deployment` + `Service` +
`Ingress` + `PVC` from the docker-compose.yml; switch the homelab Traefik
route from `http://10.0.20.13:80` to the k3s ingress; tear down the LXC. No
app code changes.
