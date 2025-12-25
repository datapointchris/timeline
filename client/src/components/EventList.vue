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

function getTypeColor(type: string | null): string {
  const colors: Record<string, string> = {
    book: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    person: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    event: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    movement: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    idea: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    artwork: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    invention: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return colors[type || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="flex justify-center py-8">
      <div
        class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"
      ></div>
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300"
    >
      {{ error }}
    </div>

    <div v-else-if="events.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      No events yet. Create your first event to get started.
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="event in events"
        :key="event.id"
        class="text-left bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
        @click="emit('select', event)"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
            {{ event.title }}
          </h3>
          <span
            v-if="event.type"
            :class="['text-xs px-2 py-1 rounded-full whitespace-nowrap', getTypeColor(event.type)]"
          >
            {{ event.type }}
          </span>
        </div>

        <p v-if="formatDate(event)" class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ formatDate(event) }}
        </p>

        <p
          v-if="event.content"
          class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3"
          v-html="event.content"
        ></p>
      </button>
    </div>
  </div>
</template>
