import { db } from '../db/index.js';
import type { Relationship, CreateRelationshipInput, RelationshipType } from 'shared';

const VALID_TYPES: RelationshipType[] = [
  'influenced_by',
  'caused',
  'contemporary_with',
  'preceded',
  'part_of',
  'related',
  'response_to',
];

export function getRelationshipsByEventId(eventId: string): {
  outgoing: Relationship[];
  incoming: Relationship[];
} {
  const outgoing = db.prepare(`
    SELECT * FROM relationships WHERE source_id = ?
  `).all(eventId) as Relationship[];

  const incoming = db.prepare(`
    SELECT * FROM relationships WHERE target_id = ?
  `).all(eventId) as Relationship[];

  return { outgoing, incoming };
}

export function createRelationship(input: CreateRelationshipInput): Relationship {
  if (!VALID_TYPES.includes(input.type)) {
    throw new Error(`Invalid relationship type: ${input.type}`);
  }

  const sourceExists = db.prepare('SELECT 1 FROM events WHERE id = ?').get(input.source_id);
  if (!sourceExists) {
    throw new Error(`Source event not found: ${input.source_id}`);
  }

  const targetExists = db.prepare('SELECT 1 FROM events WHERE id = ?').get(input.target_id);
  if (!targetExists) {
    throw new Error(`Target event not found: ${input.target_id}`);
  }

  if (input.source_id === input.target_id) {
    throw new Error('Cannot create relationship to self');
  }

  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO relationships (source_id, target_id, type, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(input.source_id, input.target_id, input.type, input.notes || null, now);

  return db.prepare('SELECT * FROM relationships WHERE id = ?').get(result.lastInsertRowid) as Relationship;
}

export function deleteRelationship(id: number): boolean {
  const result = db.prepare('DELETE FROM relationships WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getRelationshipById(id: number): Relationship | null {
  return db.prepare('SELECT * FROM relationships WHERE id = ?').get(id) as Relationship | null;
}
