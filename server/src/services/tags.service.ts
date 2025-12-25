import { db } from '../db/index.js';
import type { Tag } from 'shared';

export function getAllTags(): Tag[] {
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Tag[];
}

export function getTagById(id: number): Tag | null {
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | null;
}

export function getTagByName(name: string): Tag | null {
  return db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as Tag | null;
}

export function createTag(name: string): Tag {
  const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid) as Tag;
}

export function deleteTag(id: number): boolean {
  const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getTagsForEvent(eventId: string): Tag[] {
  return db.prepare(`
    SELECT t.* FROM tags t
    JOIN event_tags et ON t.id = et.tag_id
    WHERE et.event_id = ?
    ORDER BY t.name ASC
  `).all(eventId) as Tag[];
}

export function addTagToEvent(eventId: string, tagName: string): Tag {
  const eventExists = db.prepare('SELECT 1 FROM events WHERE id = ?').get(eventId);
  if (!eventExists) {
    throw new Error(`Event not found: ${eventId}`);
  }

  let tag = getTagByName(tagName);
  if (!tag) {
    tag = createTag(tagName);
  }

  const existingLink = db.prepare(
    'SELECT 1 FROM event_tags WHERE event_id = ? AND tag_id = ?'
  ).get(eventId, tag.id);

  if (!existingLink) {
    db.prepare('INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)').run(eventId, tag.id);
  }

  return tag;
}

export function removeTagFromEvent(eventId: string, tagId: number): boolean {
  const result = db.prepare(
    'DELETE FROM event_tags WHERE event_id = ? AND tag_id = ?'
  ).run(eventId, tagId);
  return result.changes > 0;
}
