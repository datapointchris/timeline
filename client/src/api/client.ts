import type {
  TimelineEvent,
  EventWithRelations,
  CreateEventInput,
  UpdateEventInput,
  Tag,
  Relationship,
  CreateRelationshipInput,
} from 'shared/types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  events: {
    list: (params?: { type?: string; tag?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.tag) searchParams.set('tag', params.tag);
      const query = searchParams.toString();
      return request<TimelineEvent[]>(`/events${query ? `?${query}` : ''}`);
    },

    get: (id: string) => request<EventWithRelations>(`/events/${id}`),

    create: (data: CreateEventInput) =>
      request<TimelineEvent>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateEventInput) =>
      request<TimelineEvent>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/events/${id}`, {
        method: 'DELETE',
      }),

    search: (query: string) =>
      request<TimelineEvent[]>(`/events/search?q=${encodeURIComponent(query)}`),
  },

  tags: {
    list: () => request<Tag[]>('/tags'),

    addToEvent: (eventId: string, name: string) =>
      request<Tag>(`/tags/events/${eventId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    removeFromEvent: (eventId: string, tagId: number) =>
      request<void>(`/tags/events/${eventId}/tags/${tagId}`, {
        method: 'DELETE',
      }),
  },

  relationships: {
    create: (data: CreateRelationshipInput) =>
      request<Relationship>('/relationships', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<void>(`/relationships/${id}`, {
        method: 'DELETE',
      }),
  },
};
