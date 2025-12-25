import express from 'express';
import cors from 'cors';
import { db, initializeDatabase, closeDatabase } from './db/index.js';

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
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
