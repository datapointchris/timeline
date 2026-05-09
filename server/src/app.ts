import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import eventsRouter from './routes/events.js';
import relationshipsRouter from './routes/relationships.js';
import tagsRouter from './routes/tags.js';
import { db } from './db/index.js';
import { logger } from './lib/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );

  if (!isProduction) {
    app.use(cors());
  }
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (_req, res) => {
    try {
      const dbCheck = db.prepare('SELECT 1 as ok').get() as { ok: number } | undefined;
      if (dbCheck?.ok !== 1) {
        res.status(503).json({ status: 'not_ready', database: 'unexpected_response' });
        return;
      }
      res.json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'readiness probe failed');
      res.status(503).json({ status: 'not_ready', database: 'error' });
    }
  });

  app.use('/api/events', eventsRouter);
  app.use('/api/relationships', relationshipsRouter);
  app.use('/api/tags', tagsRouter);

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error({ err }, 'unhandled error');
      res.status(500).json({ error: 'Internal server error' });
    }
  );

  return app;
}
