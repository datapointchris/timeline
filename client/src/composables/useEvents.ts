import { ref, readonly } from 'vue';
import type {
  TimelineEvent,
  EventWithRelations,
  CreateEventInput,
  UpdateEventInput,
} from 'shared/types';
import { api } from '../api/client';

const events = ref<TimelineEvent[]>([]);
const selectedEvent = ref<EventWithRelations | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

export function useEvents() {
  async function fetchEvents(params?: { type?: string; tag?: string }) {
    loading.value = true;
    error.value = null;
    try {
      events.value = await api.events.list(params);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch events';
    } finally {
      loading.value = false;
    }
  }

  async function fetchEvent(id: string) {
    loading.value = true;
    error.value = null;
    try {
      selectedEvent.value = await api.events.get(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch event';
      selectedEvent.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(data: CreateEventInput) {
    loading.value = true;
    error.value = null;
    try {
      const newEvent = await api.events.create(data);
      events.value = [...events.value, newEvent];
      return newEvent;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create event';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateEvent(id: string, data: UpdateEventInput) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await api.events.update(id, data);
      events.value = events.value.map(e => (e.id === id ? updated : e));
      if (selectedEvent.value?.id === id) {
        await fetchEvent(id);
      }
      return updated;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update event';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteEvent(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.events.delete(id);
      events.value = events.value.filter(e => e.id !== id);
      if (selectedEvent.value?.id === id) {
        selectedEvent.value = null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete event';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function searchEvents(query: string) {
    loading.value = true;
    error.value = null;
    try {
      return await api.events.search(query);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to search events';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function clearSelectedEvent() {
    selectedEvent.value = null;
  }

  return {
    events: readonly(events),
    selectedEvent: readonly(selectedEvent),
    loading: readonly(loading),
    error: readonly(error),
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    searchEvents,
    clearSelectedEvent,
  };
}
