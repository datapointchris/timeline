import { db, initializeDatabase } from '../db/index.js';
import { beforeEach } from 'vitest';

export function resetDatabase() {
  db.exec(`
    DELETE FROM media;
    DELETE FROM event_tags;
    DELETE FROM relationships;
    DELETE FROM tags;
    DELETE FROM events;
  `);
}

beforeEach(() => {
  initializeDatabase();
  resetDatabase();
});
