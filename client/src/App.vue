<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Timeline from './components/Timeline.vue';
import EventList from './components/EventList.vue';
import EventDetail from './components/EventDetail.vue';
import EventForm from './components/EventForm.vue';
import FilterBar from './components/FilterBar.vue';
import { useEvents } from './composables/useEvents';
import type { TimelineEvent, EventType } from 'shared/types';

const { events, fetchEvents, searchEvents } = useEvents();
const selectedEventId = ref<string | null>(null);
const viewMode = ref<'timeline' | 'list'>('timeline');
const showForm = ref(false);
const editingEventId = ref<string | null>(null);

const currentFilters = ref<{ search?: string; type?: EventType; tag?: string }>({});
const searchResults = ref<TimelineEvent[] | null>(null);

const displayedEvents = computed(() => {
  if (searchResults.value !== null) {
    return searchResults.value;
  }
  return events.value;
});

async function handleFilter(params: { search?: string; type?: EventType; tag?: string }) {
  currentFilters.value = params;

  if (params.search) {
    const results = await searchEvents(params.search);
    let filtered = results;
    if (params.type) {
      filtered = filtered.filter(e => e.type === params.type);
    }
    if (params.tag) {
      filtered = filtered.filter(e => e.title.toLowerCase().includes(params.tag!.toLowerCase()));
    }
    searchResults.value = filtered;
  } else {
    searchResults.value = null;
    await fetchEvents({ type: params.type, tag: params.tag });
  }
}

function selectEvent(event: TimelineEvent) {
  selectedEventId.value = event.id;
}

function closeDetail() {
  selectedEventId.value = null;
}

function navigateToEvent(event: TimelineEvent) {
  selectedEventId.value = event.id;
}

function openCreateForm() {
  editingEventId.value = null;
  showForm.value = true;
}

function openEditForm(id: string) {
  editingEventId.value = id;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingEventId.value = null;
}

async function onEventSaved() {
  await handleFilter(currentFilters.value);
  if (editingEventId.value) {
    selectedEventId.value = editingEventId.value;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showForm.value) {
      closeForm();
    } else if (selectedEventId.value) {
      closeDetail();
    }
  }
}

onMounted(() => {
  fetchEvents();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-content container">
        <div class="header-left">
          <h1 class="header-title">Timeline</h1>
          <p class="header-subtitle">Interactive historical timeline with relationship mapping</p>
        </div>
        <div class="header-actions">
          <div class="view-toggle">
            <button
              class="btn"
              :class="viewMode === 'timeline' ? 'btn-active' : 'btn-ghost'"
              @click="viewMode = 'timeline'"
            >
              Timeline
            </button>
            <button
              class="btn"
              :class="viewMode === 'list' ? 'btn-active' : 'btn-ghost'"
              @click="viewMode = 'list'"
            >
              Cards
            </button>
          </div>
          <button class="btn btn-primary" @click="openCreateForm">+ Add Event</button>
        </div>
      </div>
    </header>

    <main class="main container">
      <div v-if="showForm" class="form-overlay">
        <EventForm :event-id="editingEventId" @close="closeForm" @saved="onEventSaved" />
      </div>

      <div v-else class="content">
        <FilterBar @filter="handleFilter" />

        <div v-if="viewMode === 'timeline'" class="timeline-section">
          <Timeline
            :events="displayedEvents"
            :selected-event-id="selectedEventId"
            @select="selectEvent"
          />
        </div>

        <div class="layout" :class="{ 'layout-split': selectedEventId }">
          <div v-if="viewMode === 'list'" class="events-section">
            <EventList :events="displayedEvents" @select="selectEvent" />
          </div>

          <div v-if="selectedEventId" class="detail-section">
            <EventDetail
              :event-id="selectedEventId"
              @close="closeDetail"
              @navigate="navigateToEvent"
              @edit="openEditForm(selectedEventId!)"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.header {
  background-color: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  padding-bottom: 1rem;
  gap: 1rem;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.header-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.main {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.form-overlay {
  padding: 1rem 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.layout {
  display: grid;
  gap: 2rem;
}

.layout-split {
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .layout-split {
    grid-template-columns: 1fr 1fr;
  }

  .detail-section {
    position: sticky;
    top: 2rem;
    align-self: start;
  }
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
