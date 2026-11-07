import Database from 'better-sqlite3'

// Each failure a route answers differently gets its own class and a stable `code`.
// Routes branch on the class, and the response carries the code beside the message,
// so a client or test decides on the code and the wording stays free to change.

export type ErrorCode = 'not_found' | 'invalid_relationship_type' | 'self_relationship' | 'duplicate'

export class NotFoundError extends Error {
  readonly code = 'not_found' satisfies ErrorCode
}

export class InvalidRelationshipTypeError extends Error {
  readonly code = 'invalid_relationship_type' satisfies ErrorCode
}

export class SelfRelationshipError extends Error {
  readonly code = 'self_relationship' satisfies ErrorCode
}

// SQLite's extended result codes for a row that repeats a unique key. A repeated
// event id breaks the primary key; a repeated relationship breaks a UNIQUE index.
const DUPLICATE_KEY_CODES = new Set(['SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'])

export function isDuplicateKey(error: unknown): boolean {
  return error instanceof Database.SqliteError && DUPLICATE_KEY_CODES.has(error.code)
}
