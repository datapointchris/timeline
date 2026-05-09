# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS builder
WORKDIR /app

# better-sqlite3 needs python/make/g++ at install time for native compilation
RUN apk add --no-cache python3 make g++

# Install deps with the lockfile and per-workspace package.json files only,
# so this layer only invalidates when dependencies change, not on every source edit.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
COPY shared/package.json shared/
RUN npm ci

# Build all workspaces. shared is type-only (its build is a no-op echo),
# server compiles via tsc to server/dist, client builds the Vite SPA to client/dist.
COPY . .
RUN npm run build

# Drop dev dependencies in place. This produces a single hoisted node_modules
# tree we can copy into the runtime image without re-running npm.
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only the runtime artifacts. Notes:
#  - shared/ is intentionally absent: every server import from 'shared' is
#    `import type` which TypeScript erases at emit, so the runtime bundle has
#    zero references to the shared package.
#  - migrations live at /app/migrations to match the default MIGRATIONS_FOLDER
#    env value used in docker-compose.
#  - client-dist is at /app/client-dist to match the default STATIC_DIR in
#    server/src/index.ts.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/migrations ./migrations
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/client/dist ./client-dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server/dist/index.js"]
