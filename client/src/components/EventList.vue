<script setup lang="ts">
import type { EventSummary } from 'shared/types'
import { formatEventDate } from '../eventLabels'

defineProps<{
  events: readonly EventSummary[]
}>()

const emit = defineEmits<{
  select: [event: EventSummary]
}>()
</script>

<template>
  <div class="event-list">
    <div
      v-if="events.length === 0"
      class="empty">
      No events found. Try adjusting your filters or create a new event.
    </div>

    <div
      v-else
      class="grid-events">
      <button
        v-for="event in events"
        :key="event.id"
        class="event-card card"
        @click="emit('select', event)">
        <div class="event-header">
          <h3 class="event-title line-clamp-2">{{ event.title }}</h3>
          <span
            v-if="event.type"
            class="tag"
            :class="`tag-${event.type}`">
            {{ event.type }}
          </span>
        </div>

        <p
          v-if="formatEventDate(event)"
          class="event-date">
          {{ formatEventDate(event) }}
        </p>

        <p
          v-if="event.summary"
          class="event-content line-clamp-3">
          {{ event.summary }}
        </p>
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
