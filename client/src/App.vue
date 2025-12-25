<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Timeline from './components/Timeline.vue';
import EventList from './components/EventList.vue';
import EventDetail from './components/EventDetail.vue';
import EventForm from './components/EventForm.vue';
import { useEvents } from './composables/useEvents';
import type { TimelineEvent } from 'shared/types';

const { events, fetchEvents } = useEvents();
const selectedEventId = ref<string | null>(null);
const viewMode = ref<'timeline' | 'list'>('timeline');
const showForm = ref(false);
const editingEventId = ref<string | null>(null);

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

function onEventSaved() {
  fetchEvents();
  if (editingEventId.value) {
    selectedEventId.value = editingEventId.value;
  }
}
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
        <div v-if="viewMode === 'timeline'" class="timeline-section">
          <Timeline :events="events" :selected-event-id="selectedEventId" @select="selectEvent" />
        </div>

        <div class="layout" :class="{ 'layout-split': selectedEventId }">
          <div v-if="viewMode === 'list'" class="events-section">
            <EventList @select="selectEvent" />
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
