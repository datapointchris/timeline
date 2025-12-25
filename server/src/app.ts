import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import relationshipsRouter from './routes/relationships.js';
import tagsRouter from './routes/tags.js';
import { db } from './db/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    const dbCheck = db.prepare('SELECT 1 as ok').get() as { ok: number };
    res.json({
      status: 'ok',
      database: dbCheck?.ok === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/events', eventsRouter);
  app.use('/api/relationships', relationshipsRouter);
  app.use('/api/tags', tagsRouter);

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  );

  return app;
}
