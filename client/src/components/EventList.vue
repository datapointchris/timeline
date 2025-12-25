<script setup lang="ts">
import { onMounted } from 'vue';
import { useEvents } from '../composables/useEvents';
import type { TimelineEvent } from 'shared/types';

const emit = defineEmits<{
  select: [event: TimelineEvent];
}>();

const { events, loading, error, fetchEvents } = useEvents();

onMounted(() => {
  fetchEvents();
});

function formatDate(event: TimelineEvent): string {
  if (event.date_display) return event.date_display;
  if (!event.date_start) return '';

  const prefix = event.is_bce ? 'BCE ' : '';
  if (event.date_end && event.date_end !== event.date_start) {
    return `${prefix}${event.date_start} – ${event.date_end}`;
  }
  return `${prefix}${event.date_start}`;
}
</script>

<template>
  <div class="event-list">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-box">
      {{ error }}
    </div>

    <div v-else-if="events.length === 0" class="empty">
      No events yet. Create your first event to get started.
    </div>

    <div v-else class="grid-events">
      <button
        v-for="event in events"
        :key="event.id"
        class="event-card card"
        @click="emit('select', event)"
      >
        <div class="event-header">
          <h3 class="event-title line-clamp-2">{{ event.title }}</h3>
          <span v-if="event.type" class="tag" :class="`tag-${event.type}`">
            {{ event.type }}
          </span>
        </div>

        <p v-if="formatDate(event)" class="event-date">
          {{ formatDate(event) }}
        </p>

        <p v-if="event.content" class="event-content line-clamp-3" v-html="event.content"></p>
      </button>
    </div>
  </div>
</template>

<style scoped>
.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.empty {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-secondary);
}

.event-card {
  text-align: left;
  padding: 1rem;
  cursor: pointer;
  width: 100%;
}

.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.event-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.event-date {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
}

.event-content {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
