<script setup lang="ts">
import { watch } from 'vue';
import { useEvents } from '../composables/useEvents';
import type { TimelineEvent } from 'shared/types';
import { RELATIONSHIP_INVERSES } from 'shared/types';

const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [event: TimelineEvent];
  edit: [];
}>();

const { selectedEvent, loading, error, fetchEvent } = useEvents();

watch(
  () => props.eventId,
  id => {
    if (id) fetchEvent(id);
  },
  { immediate: true }
);

function formatDate(): string {
  if (!selectedEvent.value) return '';
  const event = selectedEvent.value;
  if (event.date_display) return event.date_display;
  if (!event.date_start) return '';

  const prefix = event.is_bce ? 'BCE ' : '';
  if (event.date_end && event.date_end !== event.date_start) {
    return `${prefix}${event.date_start} – ${event.date_end}`;
  }
  return `${prefix}${event.date_start}`;
}

function formatRelationType(type: string, inverse: boolean): string {
  if (inverse) {
    return RELATIONSHIP_INVERSES[type as keyof typeof RELATIONSHIP_INVERSES] || type;
  }
  return type.replace(/_/g, ' ');
}
</script>

<template>
  <div class="detail-panel card">
    <div class="panel-header">
      <h2 class="panel-title">Event Details</h2>
      <div class="panel-actions">
        <button class="action-btn" title="Edit event" @click="emit('edit')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
            />
          </svg>
        </button>
        <button class="action-btn" title="Close" @click="emit('close')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="error" class="error-box">
        {{ error }}
      </div>

      <div v-else-if="selectedEvent" class="event-content">
        <div class="event-header">
          <h1 class="event-title">{{ selectedEvent.title }}</h1>

          <div class="event-meta">
            <span v-if="selectedEvent.type" class="tag" :class="`tag-${selectedEvent.type}`">
              {{ selectedEvent.type }}
            </span>
            <span v-if="formatDate()" class="tag tag-other">
              {{ formatDate() }}
            </span>
          </div>

          <div v-if="selectedEvent.tags.length > 0" class="tags-list">
            <span v-for="tag in selectedEvent.tags" :key="tag.id" class="tag tag-purple">
              {{ tag.name }}
            </span>
          </div>
        </div>

        <div v-if="selectedEvent.content" class="prose" v-html="selectedEvent.content"></div>

        <div v-if="selectedEvent.relationships.length > 0" class="relationships-section">
          <h3 class="section-title">Relationships</h3>
          <div class="relationships-list">
            <button
              v-for="rel in selectedEvent.relationships"
              :key="rel.id"
              class="relationship-item"
              @click="emit('navigate', rel.event)"
            >
              <div class="relationship-main">
                <span class="relationship-type">{{ formatRelationType(rel.type, false) }}</span>
                <span class="relationship-target">{{ rel.event.title }}</span>
              </div>
              <span v-if="rel.notes" class="relationship-notes">{{ rel.notes }}</span>
            </button>
          </div>
        </div>

        <div v-if="selectedEvent.inverse_relationships.length > 0" class="relationships-section">
          <h3 class="section-title">Referenced By</h3>
          <div class="relationships-list">
            <button
              v-for="rel in selectedEvent.inverse_relationships"
              :key="rel.id"
              class="relationship-item"
              @click="emit('navigate', rel.event)"
            >
              <div class="relationship-main">
                <span class="relationship-type">{{ formatRelationType(rel.type, true) }}</span>
                <span class="relationship-target">{{ rel.event.title }}</span>
              </div>
              <span v-if="rel.notes" class="relationship-notes">{{ rel.notes }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
  cursor: pointer;
}

.action-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}

.panel-body {
  padding: 1.5rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.event-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.relationships-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.relationship-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  padding: 0.75rem;
  background-color: var(--color-bg);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
  width: 100%;
}

.relationship-item:hover {
  background-color: var(--color-border);
}

.relationship-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.relationship-type {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  min-width: 7.5rem;
}

.relationship-target {
  font-weight: 500;
}

.relationship-notes {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
  padding-left: 8.25rem;
}
</style>
