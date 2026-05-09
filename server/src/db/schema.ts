import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary'),
    details: text('details'),
    dateStart: text('date_start'),
    dateEnd: text('date_end'),
    datePrecision: text('date_precision', {
      enum: ['exact', 'year', 'decade', 'century', 'approximate', 'uncertain'],
    }),
    dateDisplay: text('date_display'),
    isBce: integer('is_bce').default(0),
    type: text('type', {
      enum: ['book', 'person', 'event', 'movement', 'idea', 'artwork', 'invention', 'other'],
    }),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  t => [index('idx_events_date').on(t.dateStart, t.isBce), index('idx_events_type').on(t.type)]
);

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const eventTags = sqliteTable(
  'event_tags',
  {
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  t => [
    primaryKey({ columns: [t.eventId, t.tagId] }),
    index('idx_event_tags_event').on(t.eventId),
    index('idx_event_tags_tag').on(t.tagId),
  ]
);

export const relationships = sqliteTable(
  'relationships',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sourceId: text('source_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    targetId: text('target_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'influenced_by',
        'caused',
        'contemporary_with',
        'preceded',
        'part_of',
        'related',
        'response_to',
      ],
    }).notNull(),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  t => [
    uniqueIndex('relationships_source_target_type_unique').on(t.sourceId, t.targetId, t.type),
    index('idx_relationships_source').on(t.sourceId),
    index('idx_relationships_target').on(t.targetId),
    index('idx_relationships_type').on(t.type),
  ]
);

export const media = sqliteTable(
  'media',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['image', 'link', 'video_url'] }),
    url: text('url').notNull(),
    caption: text('caption'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  t => [index('idx_media_event').on(t.eventId)]
);
