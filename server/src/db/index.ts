import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

const DB_PATH =
  process.env.DATABASE_PATH ??
  (isTest ? ':memory:' : path.join(__dirname, '..', '..', '..', 'data', 'timeline.db'));

const MIGRATIONS_FOLDER =
  process.env.MIGRATIONS_FOLDER ?? path.join(__dirname, '..', '..', 'migrations');

export const db: DatabaseType = new Database(DB_PATH);

if (!isTest) {
  db.pragma('journal_mode = WAL');
}
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  const drizzleDb = drizzle(db);
  migrate(drizzleDb, { migrationsFolder: MIGRATIONS_FOLDER });
}

export function closeDatabase(): void {
  db.close();
}
