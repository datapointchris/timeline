# Timeline App

Interactive historical timeline with relationship mapping. `README.md` is the reference for the
data model, the API, the schema and migrations, the container and the checks. The rules below are
the constraints to keep when changing the repo.

## Critical Rules

- **NEVER commit `data/timeline.db`** — gitignored. The dev DB is local-only.
  Production data lives at `/var/db/timeline/timeline.db` on the production host
  and never enters the image or the deploy artifact.
- **Never edit a migration under `server/migrations/` once it is on main.** Fix forward with a new
  one.
- **Schema changes go through `npm --prefix server run db:generate`** after editing
  `server/src/db/schema.ts`, and the generated SQL is committed with them.
- **Never add `IF NOT EXISTS` to a new migration.** `0000_goofy_spectrum.sql` is the one hand-edited
  exception. README § "The schema" says why.
- **One service file keeps to one query style**, Drizzle or `db.prepare(...)`. README § "The schema"
  describes the split.
- **The server imports only types from `shared`.** The runtime image ships no `shared/`. README §
  "The container" describes the layout.

## Deployment

**Production runs behind an authenticating reverse proxy.**
Pushes to `main` auto-deploy via GHA → ghcr.io → webhook → `docker compose pull && up`
on the production host.

- **This repo's Node version is `node:24-alpine`** in both `Dockerfile` stages.
- **SQLite snapshots must use `sqlite3 .backup`**, never a raw `cp`, because the database runs in
  WAL mode and a copy can tear a page.
