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
- **Schema changes go through `npm --prefix server run db:generate`** after
  editing `server/src/db/schema.ts` → commit the SQL → next deploy applies it
  on container start.

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

`npm run dev` runs the server on :3000 and Vite on :5173, which proxies `/api`.
`npm --prefix server run db:seed` seeds the dev DB with sample events and relationships.

## Deployment

**Live at <https://timeline.ichrisbirch.com>** behind Authelia ForwardAuth.
Pushes to `main` auto-deploy via GHA → ghcr.io → webhook → `docker compose pull && up`
on timeline-lxc.

Things to know when changing this repo:

- **This repo's Node version is `node:24-alpine`** in both `Dockerfile` stages.
- **Backups run nightly** via backup-lxc → NAS → Backblaze B2 (30-snapshot
  retention). Restore procedure documented in `~/homelab/docs/backups.md`.
  SQLite snapshots use `sqlite3 .backup` (not raw `cp`) to avoid torn-page
  issues with WAL.
- **`shared` workspace is type-only at runtime.** Every server import from
  `'shared'` is `import type { ... }`, so TypeScript erases it at emit. The
  Docker runtime image deliberately does not include `shared/` in its layout
  — only the compiled `server/dist/` and `client/dist/` plus pruned
  `node_modules/`.
- **`/api/health` is liveness** and answers 200 whatever the DB state; the compose
  healthcheck probes it. **`/api/ready` is readiness**: it pings the DB and returns 503 on failure.
