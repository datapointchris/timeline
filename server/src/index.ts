import express from 'express';
import cors from 'cors';
import { db, initializeDatabase, closeDatabase } from './db/index.js';
import eventsRouter from './routes/events.js';
import relationshipsRouter from './routes/relationships.js';
import tagsRouter from './routes/tags.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initializeDatabase();

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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/health`);
  console.log(`  GET    /api/events`);
  console.log(`  GET    /api/events/:id`);
  console.log(`  POST   /api/events`);
  console.log(`  PUT    /api/events/:id`);
  console.log(`  DELETE /api/events/:id`);
  console.log(`  GET    /api/events/search?q=...`);
  console.log(`  POST   /api/relationships`);
  console.log(`  DELETE /api/relationships/:id`);
  console.log(`  GET    /api/tags`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
