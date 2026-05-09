import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './app.js';
import { initializeDatabase, closeDatabase } from './db/index.js';
import { logger } from './lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

initializeDatabase();

const app = createApp();

if (isProduction) {
  // In the production image, the Vue SPA is built to client/dist and copied
  // alongside the server bundle. Serve it AFTER the /api routes so API paths
  // win over any same-name static asset, then fall back to index.html for
  // client-side routing (Vue Router history mode).
  const staticDir = process.env.STATIC_DIR ?? path.resolve(__dirname, '..', '..', 'client-dist');
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  logger.info({ staticDir }, 'serving SPA static assets');
}

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV ?? 'development' }, 'server listening');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'shutdown initiated');
  const forceExit = setTimeout(() => {
    logger.error('forced shutdown after 10s drain timeout');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(err => {
    if (err) {
      logger.error({ err }, 'http server close error');
    }
    try {
      closeDatabase();
    } catch (closeErr) {
      logger.error({ err: closeErr }, 'database close error');
    }
    logger.info('shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
