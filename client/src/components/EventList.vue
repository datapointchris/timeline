<script setup lang="ts">
import type { TimelineEvent } from 'shared/types';

defineProps<{
  events: readonly TimelineEvent[];
}>();

const emit = defineEmits<{
  select: [event: TimelineEvent];
}>();

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
    <div v-if="events.length === 0" class="empty">
      No events found. Try adjusting your filters or create a new event.
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

        <!-- eslint-disable-next-line vue/no-v-html -->
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
