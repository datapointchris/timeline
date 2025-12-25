export type DatePrecision = 'exact' | 'year' | 'decade' | 'century' | 'approximate' | 'uncertain';

export type EventType =
  | 'book'
  | 'person'
  | 'event'
  | 'movement'
  | 'idea'
  | 'artwork'
  | 'invention'
  | 'other';

export type RelationshipType =
  | 'influenced_by'
  | 'caused'
  | 'contemporary_with'
  | 'preceded'
  | 'part_of'
  | 'related'
  | 'response_to';

export type MediaType = 'image' | 'link' | 'video_url';

export interface TimelineEvent {
  id: string;
  title: string;
  content: string | null;
  date_start: string | null;
  date_end: string | null;
  date_precision: DatePrecision | null;
  date_display: string | null;
  is_bce: boolean;
  type: EventType | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface EventTag {
  event_id: string;
  tag_id: number;
}

export interface Relationship {
  id: number;
  source_id: string;
  target_id: string;
  type: RelationshipType;
  notes: string | null;
  created_at: string;
}

export interface Media {
  id: number;
  event_id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface EventWithRelations extends TimelineEvent {
  tags: Tag[];
  media: Media[];
  relationships: RelationshipWithEvent[];
  inverse_relationships: RelationshipWithEvent[];
}

export interface RelationshipWithEvent extends Relationship {
  event: TimelineEvent;
}

export const RELATIONSHIP_INVERSES: Record<RelationshipType, string> = {
  influenced_by: 'influenced',
  caused: 'caused_by',
  contemporary_with: 'contemporary_with',
  preceded: 'followed',
  part_of: 'contains',
  related: 'related',
  response_to: 'prompted',
};

export interface CreateEventInput {
  id: string;
  title: string;
  content?: string;
  date_start?: string;
  date_end?: string;
  date_precision?: DatePrecision;
  date_display?: string;
  is_bce?: boolean;
  type?: EventType;
  tags?: string[];
}

export interface UpdateEventInput {
  title?: string;
  content?: string;
  date_start?: string;
  date_end?: string;
  date_precision?: DatePrecision;
  date_display?: string;
  is_bce?: boolean;
  type?: EventType;
}

export interface CreateRelationshipInput {
  source_id: string;
  target_id: string;
  type: RelationshipType;
  notes?: string;
}

export interface CreateMediaInput {
  event_id: string;
  type: MediaType;
  url: string;
  caption?: string;
}
