<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TimelineEvent, EventWithRelations } from 'shared/types';
import { RELATIONSHIP_INVERSES } from 'shared/types';
import { api } from '../api/client';

const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [event: TimelineEvent];
  edit: [];
  filterByType: [type: string];
  filterByTag: [tag: string];
  showDetails: [eventId: string];
}>();

function handleTitleClick() {
  if (event.value?.details) {
    emit('showDetails', event.value.id);
  }
}

const event = ref<EventWithRelations | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function fetchEvent(id: string) {
  loading.value = true;
  error.value = null;
  try {
    event.value = await api.events.get(id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch event';
    event.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.eventId,
  id => {
    if (id) fetchEvent(id);
  },
  { immediate: true }
);

function formatDate(): string {
  if (!event.value) return '';
  const ev = event.value;
  if (ev.date_display) return ev.date_display;
  if (!ev.date_start) return '';

  const prefix = ev.is_bce ? 'BCE ' : '';
  if (ev.date_end && ev.date_end !== ev.date_start) {
    return `${prefix}${ev.date_start} – ${ev.date_end}`;
  }
  return `${prefix}${ev.date_start}`;
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
      <span v-if="event" class="panel-title">{{ event.title }}</span>
      <span v-else class="panel-title">Loading...</span>
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

      <div v-else-if="event" class="event-content">
        <div class="event-header">
          <div class="event-meta">
            <button
              v-if="event.type"
              class="tag tag-clickable"
              :class="`tag-${event.type}`"
              @click="emit('filterByType', event.type)"
            >
              {{ event.type }}
            </button>
            <span v-if="formatDate()" class="tag tag-other">
              {{ formatDate() }}
            </span>
          </div>

          <div v-if="event.tags.length > 0" class="tags-list">
            <button
              v-for="tag in event.tags"
              :key="tag.id"
              class="tag tag-clickable tag-purple"
              @click="emit('filterByTag', tag.name)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <p v-if="event.summary" class="event-summary">{{ event.summary }}</p>

        <button v-if="event.details" class="detailed-info-btn" @click="handleTitleClick">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clip-rule="evenodd"
            />
          </svg>
          View Full Details
        </button>

        <div v-if="event.relationships.length > 0" class="relationships-section">
          <h3 class="section-title">Relationships</h3>
          <div class="relationships-list">
            <button
              v-for="rel in event.relationships"
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

        <div v-if="event.inverse_relationships.length > 0" class="relationships-section">
          <h3 class="section-title">Referenced By</h3>
          <div class="relationships-list">
            <button
              v-for="rel in event.inverse_relationships"
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
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.event-summary {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.detailed-info-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.detailed-info-btn:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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

.tag-clickable {
  cursor: pointer;
  border: none;
  transition: opacity 0.15s ease;
}

.tag-clickable:hover {
  opacity: 0.7;
}
</style>
