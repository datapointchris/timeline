<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Timeline from './components/Timeline.vue';
import EventList from './components/EventList.vue';
import EventDetail from './components/EventDetail.vue';
import { useEvents } from './composables/useEvents';
import type { TimelineEvent } from 'shared/types';

const { events, fetchEvents } = useEvents();
const selectedEventId = ref<string | null>(null);
const viewMode = ref<'timeline' | 'list'>('timeline');

onMounted(() => {
  fetchEvents();
});

function selectEvent(event: TimelineEvent) {
  selectedEventId.value = event.id;
}

function closeDetail() {
  selectedEventId.value = null;
}

function navigateToEvent(event: TimelineEvent) {
  selectedEventId.value = event.id;
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Timeline</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Interactive historical timeline with relationship mapping
            </p>
          </div>
          <div class="flex gap-2">
            <button
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'timeline'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
              ]"
              @click="viewMode = 'timeline'"
            >
              Timeline
            </button>
            <button
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
              ]"
              @click="viewMode = 'list'"
            >
              Cards
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-8">
        <div v-if="viewMode === 'timeline'">
          <Timeline :events="events" :selected-event-id="selectedEventId" @select="selectEvent" />
        </div>

        <div class="grid gap-8" :class="selectedEventId ? 'lg:grid-cols-2' : ''">
          <div v-if="viewMode === 'list'">
            <EventList @select="selectEvent" />
          </div>

          <div
            v-if="selectedEventId"
            :class="viewMode === 'timeline' ? '' : 'lg:sticky lg:top-8 lg:self-start'"
          >
            <EventDetail
              :event-id="selectedEventId"
              @close="closeDetail"
              @navigate="navigateToEvent"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
