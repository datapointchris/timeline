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
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <div
      class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Event Details</h2>
      <button
        class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        @click="emit('close')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
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

    <div class="p-6">
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

      <div v-else-if="selectedEvent" class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {{ selectedEvent.title }}
          </h1>

          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-if="selectedEvent.type"
              class="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ selectedEvent.type }}
            </span>
            <span
              v-if="formatDate()"
              class="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {{ formatDate() }}
            </span>
          </div>

          <div v-if="selectedEvent.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="tag in selectedEvent.tags"
              :key="tag.id"
              class="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <div
          v-if="selectedEvent.content"
          class="prose dark:prose-invert max-w-none"
          v-html="selectedEvent.content"
        ></div>

        <div
          v-if="selectedEvent.relationships.length > 0"
          class="border-t border-gray-200 dark:border-gray-700 pt-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Relationships</h3>
          <div class="space-y-2">
            <button
              v-for="rel in selectedEvent.relationships"
              :key="rel.id"
              class="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              @click="emit('navigate', rel.event)"
            >
              <span class="text-sm text-gray-500 dark:text-gray-400 min-w-[120px]">
                {{ formatRelationType(rel.type, false) }}
              </span>
              <span class="font-medium text-gray-900 dark:text-gray-100">
                {{ rel.event.title }}
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="selectedEvent.inverse_relationships.length > 0"
          class="border-t border-gray-200 dark:border-gray-700 pt-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Referenced By</h3>
          <div class="space-y-2">
            <button
              v-for="rel in selectedEvent.inverse_relationships"
              :key="rel.id"
              class="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              @click="emit('navigate', rel.event)"
            >
              <span class="text-sm text-gray-500 dark:text-gray-400 min-w-[120px]">
                {{ formatRelationType(rel.type, true) }}
              </span>
              <span class="font-medium text-gray-900 dark:text-gray-100">
                {{ rel.event.title }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
