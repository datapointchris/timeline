import { createApp } from './app.js';
import { initializeDatabase, closeDatabase } from './db/index.js';

const PORT = process.env.PORT || 3000;

initializeDatabase();

const app = createApp();

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
