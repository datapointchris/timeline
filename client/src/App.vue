<script setup lang="ts">
import { ref } from 'vue';
import EventList from './components/EventList.vue';
import EventDetail from './components/EventDetail.vue';
import type { TimelineEvent } from 'shared/types';

const selectedEventId = ref<string | null>(null);

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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Timeline</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Interactive historical timeline with relationship mapping
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid gap-8" :class="selectedEventId ? 'lg:grid-cols-2' : ''">
        <div>
          <EventList @select="selectEvent" />
        </div>

        <div v-if="selectedEventId" class="lg:sticky lg:top-8 lg:self-start">
          <EventDetail
            :event-id="selectedEventId"
            @close="closeDetail"
            @navigate="navigateToEvent"
          />
        </div>
      </div>
    </main>
  </div>
</template>
