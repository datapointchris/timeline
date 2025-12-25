import { db } from '../db/index.js';
import type {
  TimelineEvent,
  Tag,
  Media,
  Relationship,
  EventWithRelations,
  RelationshipWithEvent,
  CreateEventInput,
  UpdateEventInput,
} from 'shared';

const INVERSES: Record<string, string> = {
  influenced_by: 'influenced',
  caused: 'caused_by',
  contemporary_with: 'contemporary_with',
  preceded: 'followed',
  part_of: 'contains',
  related: 'related',
  response_to: 'prompted',
};

export function getAllEvents(filters?: {
  tag?: string;
  type?: string;
  after?: string;
  before?: string;
}): TimelineEvent[] {
  let query = 'SELECT * FROM events WHERE 1=1';
  const params: Record<string, string> = {};

  if (filters?.type) {
    query += ' AND type = :type';
    params.type = filters.type;
  }

  if (filters?.after) {
    query += ' AND date_start >= :after';
    params.after = filters.after;
  }

  if (filters?.before) {
    query += ' AND date_start <= :before';
    params.before = filters.before;
  }

  query += ' ORDER BY date_start ASC, is_bce DESC';

  let events = db.prepare(query).all(params) as TimelineEvent[];

  if (filters?.tag) {
    const tagFilter = db.prepare(`
      SELECT e.* FROM events e
      JOIN event_tags et ON e.id = et.event_id
      JOIN tags t ON et.tag_id = t.id
      WHERE t.name = ?
    `);
    const taggedEvents = tagFilter.all(filters.tag) as TimelineEvent[];
    const taggedIds = new Set(taggedEvents.map(e => e.id));
    events = events.filter(e => taggedIds.has(e.id));
  }

  return events.map(e => ({ ...e, is_bce: Boolean(e.is_bce) }));
}

export function getEventById(id: string): EventWithRelations | null {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as
    | TimelineEvent
    | undefined;

  if (!event) return null;

  const tags = db
    .prepare(
      `
    SELECT t.* FROM tags t
    JOIN event_tags et ON t.id = et.tag_id
    WHERE et.event_id = ?
  `
    )
    .all(id) as Tag[];

  const media = db.prepare('SELECT * FROM media WHERE event_id = ?').all(id) as Media[];

  const outgoingRels = db
    .prepare(
      `
    SELECT r.*, e.id as event_id, e.title, e.date_start, e.date_end, e.is_bce, e.type as event_type
    FROM relationships r
    JOIN events e ON r.target_id = e.id
    WHERE r.source_id = ?
  `
    )
    .all(id) as Array<
    Relationship & {
      event_id: string;
      title: string;
      date_start: string;
      date_end: string;
      is_bce: number;
      event_type: string;
    }
  >;

  const incomingRels = db
    .prepare(
      `
    SELECT r.*, e.id as event_id, e.title, e.date_start, e.date_end, e.is_bce, e.type as event_type
    FROM relationships r
    JOIN events e ON r.source_id = e.id
    WHERE r.target_id = ?
  `
    )
    .all(id) as Array<
    Relationship & {
      event_id: string;
      title: string;
      date_start: string;
      date_end: string;
      is_bce: number;
      event_type: string;
    }
  >;

  const relationships: RelationshipWithEvent[] = outgoingRels.map(r => ({
    id: r.id,
    source_id: r.source_id,
    target_id: r.target_id,
    type: r.type,
    notes: r.notes,
    created_at: r.created_at,
    event: {
      id: r.event_id,
      title: r.title,
      content: null,
      date_start: r.date_start,
      date_end: r.date_end,
      date_precision: null,
      date_display: null,
      is_bce: Boolean(r.is_bce),
      type: r.event_type as TimelineEvent['type'],
      created_at: '',
      updated_at: '',
    },
  }));

  const inverse_relationships: RelationshipWithEvent[] = incomingRels.map(r => ({
    id: r.id,
    source_id: r.source_id,
    target_id: r.target_id,
    type: INVERSES[r.type] as RelationshipWithEvent['type'],
    notes: r.notes,
    created_at: r.created_at,
    event: {
      id: r.event_id,
      title: r.title,
      content: null,
      date_start: r.date_start,
      date_end: r.date_end,
      date_precision: null,
      date_display: null,
      is_bce: Boolean(r.is_bce),
      type: r.event_type as TimelineEvent['type'],
      created_at: '',
      updated_at: '',
    },
  }));

  return {
    ...event,
    is_bce: Boolean(event.is_bce),
    tags,
    media,
    relationships,
    inverse_relationships,
  };
}

export function createEvent(input: CreateEventInput): TimelineEvent {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO events (id, title, content, date_start, date_end, date_precision, date_display, is_bce, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    input.id,
    input.title,
    input.content || null,
    input.date_start || null,
    input.date_end || null,
    input.date_precision || null,
    input.date_display || null,
    input.is_bce ? 1 : 0,
    input.type || null,
    now,
    now
  );

  if (input.tags && input.tags.length > 0) {
    for (const tagName of input.tags) {
      const existingTag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as
        | { id: number }
        | undefined;
      let tagId: number;

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName);
        tagId = Number(result.lastInsertRowid);
      }

      db.prepare('INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)').run(input.id, tagId);
    }
  }

  return db.prepare('SELECT * FROM events WHERE id = ?').get(input.id) as TimelineEvent;
}

export function updateEvent(id: string, input: UpdateEventInput): TimelineEvent | null {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.content !== undefined) {
    fields.push('content = ?');
    values.push(input.content);
  }
  if (input.date_start !== undefined) {
    fields.push('date_start = ?');
    values.push(input.date_start);
  }
  if (input.date_end !== undefined) {
    fields.push('date_end = ?');
    values.push(input.date_end);
  }
  if (input.date_precision !== undefined) {
    fields.push('date_precision = ?');
    values.push(input.date_precision);
  }
  if (input.date_display !== undefined) {
    fields.push('date_display = ?');
    values.push(input.date_display);
  }
  if (input.is_bce !== undefined) {
    fields.push('is_bce = ?');
    values.push(input.is_bce ? 1 : 0);
  }
  if (input.type !== undefined) {
    fields.push('type = ?');
    values.push(input.type);
  }

  values.push(id);

  db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as TimelineEvent;
  return { ...updated, is_bce: Boolean(updated.is_bce) };
}

export function deleteEvent(id: string): boolean {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return result.changes > 0;
}

export function searchEvents(query: string): TimelineEvent[] {
  const pattern = `%${query}%`;
  const results = db
    .prepare(
      `
    SELECT * FROM events
    WHERE title LIKE ? OR content LIKE ?
    ORDER BY date_start ASC, is_bce DESC
  `
    )
    .all(pattern, pattern) as TimelineEvent[];

  return results.map(e => ({ ...e, is_bce: Boolean(e.is_bce) }));
}
