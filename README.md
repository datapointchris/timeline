# timeline

A web app for placing books, people, events and ideas on one timeline, and for recording how they
bear on each other. A plain timeline says when each thing happened. This one also records which
entry led to which, as typed relationships readable from either end.

It is a Vue 3 single-page app, an Express API and one SQLite file. The code sits in three npm
workspaces. `client` is the app, `server` is the API, and `shared` holds the TypeScript types both
use. In production one Node container serves the API and the built app together.

## Install

```bash
git clone https://github.com/datapointchris/timeline
cd timeline
npm ci       # one lockfile at the root installs client, server and shared
```

It needs the Node major that `.nvmrc` names, and `cat .nvmrc` prints it. Docker is needed only for
the container. `task setup` runs the same `npm ci`. Task is optional, because its tasks wrap npm
scripts and `docker compose` commands. `task --list` is the index of what can be run.

## Starting from scratch

In a fresh clone, after `npm ci`:

```bash
npm --prefix server run db:seed   # create and migrate data/timeline.db, then replace its rows with samples
npm run dev                       # API on :3000, Vite on :5173 proxying /api to it, both reload on edit
curl localhost:5173/api/ready     # {"status":"ready","database":"connected",...}, through the proxy
```

Then open <http://localhost:5173>. The sample events are on the timeline.

`data/` is gitignored. `DATABASE_PATH` puts the file anywhere else. The database runs in WAL mode,
so SQLite keeps `timeline.db-wal` and `timeline.db-shm` beside it.

`db:seed` deletes every event, tag, relationship and media row before it inserts the samples. A
second run resets the database. It never adds a second copy. Point it only at a database you can
lose.

The server applies pending migrations every time it starts, and the seed does too. A fresh database
needs no separate schema step.

The proof is `/api/ready`, not `/api/health`. `/api/health` answers 200 whatever state the database
is in. `/api/ready` runs a query and answers 503 when it fails.

## The data — events on one axis, relationships stored once and read from both ends

An event is anything placed in time: a book, a person, a movement, an invention. Its `id` is a short
unique name its author types into the form, like `french-revolution`. The id is also the event's
address, `/event/<id>`. The API answers 409 to a second event with the same id.

Dates are text. `date_start` and `date_end` take `1886` or `1886-07-04`. `is_bce` marks the era, so
470 BCE is `470` with the flag set, never `-470`. `date_precision` records how sure the date is, from
`exact` to `uncertain`. `date_display` overrides the printed date in every view, as in
`c. 500 BCE`. The timeline pans from 1000 BCE to 2100 CE.

An event's `details` are rich text, written in a TipTap editor and stored as HTML. Tags are free
names. A tag is created the first time an event uses it.

A relationship is stored once, from a source event to a target, with a type and optional notes.
Reading an event returns both directions. Outgoing links arrive as `relationships`. Incoming links
arrive as `inverse_relationships`, relabeled with the inverse type. So a stored `influenced_by` from
_Beyond Good and Evil_ to _The World as Will and Representation_ reads as `influenced` from the
second. The API refuses three kinds of relationship:

- one from an event to itself, with 400
- a repeat of the same source, target and type, with 409
- one whose source or target does not exist, with 404

Deleting an event deletes its relationships, its tag links and its media. SQLite enforces the
foreign keys on every connection.

The event types, date precisions and relationship types are fixed vocabularies.
`server/src/db/schema.ts` declares each one. `shared/src/types.ts` carries the same lists, plus each
relationship type's inverse.

The home page draws the events on a zoomable timeline, or as a list. Selecting an event opens its
details beside any already open, so several read side by side.

## The API — JSON under `/api`, with no login of its own

```bash
curl localhost:3000/api/events                        # every event; ?type= and ?tag= narrow it
curl 'localhost:3000/api/events?after=-500&before=0'  # events from 500 BCE through 1 BCE
curl 'localhost:3000/api/events/search?q=revolution'  # substring match on title, summary and details
curl localhost:3000/api/events/french-revolution      # one event, its tags, media and links both ways
curl localhost:3000/api/tags                          # every tag
```

Lists come back in date order. `after` and `before` take a year and include it, with a BCE year
negative. An event's year is the leading number of its `date_start`.

Writes are `POST`, `PUT` and `DELETE` on the same nouns. `server/src/routes/` holds every route. An
event read carries a `media` list, and no route writes to it.

The app has no login. Anything that can reach the port can create, edit and delete events. Put an
authenticating proxy in front of it before it faces a network.

Outside production the server sends permissive CORS headers. In production it sends none, because
the API and the app share one origin.

## The schema — written in Drizzle, queried in raw SQL, migrated on every start

```bash
# after editing server/src/db/schema.ts
npm --prefix server run db:generate   # write the next SQL migration under server/migrations/
```

Commit the generated SQL with the schema change. The next server start applies it, and records it in
the `__drizzle_migrations` table.

Never run `drizzle-kit push`. It changes the database without writing that ledger, so the next start
applies every migration again and fails.

A migration is never edited once it is on `main`. A database that already applied a migration never
runs a later version of the same file. A fix goes in a migration of its own.

Drizzle owns the schema and the migrations, and nothing more. The services in
`server/src/services/` query through better-sqlite3's `db.prepare(...)`. Both share one connection.
Any query may use either style. One service file keeps to one style.

`server/migrations/0000_goofy_spectrum.sql` is the one migration edited by hand. Its `IF NOT EXISTS`
clauses let it apply to a database whose tables already exist. Each migration generated after it
stays as drizzle-kit wrote it.

## The container — the production image, run from this checkout before it ships

```bash
cp .env.example .env      # the container's paths; container:start refuses to run without it
task container:start      # build the image from this checkout, run it on :3000, wait until healthy
curl localhost:3000/api/ready
task container:stop
```

`container:start` runs `docker-compose.local.yml`. It mounts `./data`, which holds the database
`npm run dev` uses, and applies any pending migrations to it on start. It takes port 3000, so stop
`npm run dev` first. Its logs are `docker compose -f docker-compose.local.yml logs -f`.

The `.env` is required because the image lays files out differently from a checkout. Its migrations
sit at `/app/migrations`, and the server's default looks in `/app/server/migrations`.
`MIGRATIONS_FOLDER` in `.env.example` points it at the right one. `.env.example` documents every
variable the server reads.

With `NODE_ENV=production` the server also serves the built app. The `/api` routes come first, so an
API path always wins over a static file. Any other path returns `index.html`, and the client router
takes it from there. Logs are JSON in production and colorized text otherwise.

The runtime image holds the compiled server, the built client, the migrations and the production
`node_modules`. It holds no `shared/`. Every server import from `shared` is `import type`, which
TypeScript erases at compile. So the server may import only types from `shared`.

The image's `HEALTHCHECK` probes `/api/health`. A container whose database is failing stays healthy
and answers 503 on `/api/ready`.

Every push to `main` runs the checks, then publishes `ghcr.io/datapointchris/timeline` tagged
`latest` and `sha-<short sha>`. The image is public. `docker-compose.yml` is the production deployment,
which pulls that image. No local command reads it.

## Checks — only the server has tests, and they run in memory

```bash
npm test      # the server's suite, on an in-memory database whatever DATABASE_PATH names
task lint     # eslint, prettier --check and every workspace's type check, writing nothing
task format   # apply the lint autofixes, then prettier --write
```
