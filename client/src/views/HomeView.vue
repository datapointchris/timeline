<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Timeline from '../components/Timeline.vue';
import EventList from '../components/EventList.vue';
import EventDetail from '../components/EventDetail.vue';
import EventForm from '../components/EventForm.vue';
import FilterBar from '../components/FilterBar.vue';
import SlideOver from '../components/SlideOver.vue';
import { useEvents } from '../composables/useEvents';
import type { TimelineEvent, EventType } from 'shared/types';

const { events, fetchEvents, searchEvents } = useEvents();
const selectedEventIds = ref<string[]>([]);
const viewMode = ref<'timeline' | 'list'>('timeline');
const showMode = ref<'all' | 'selected'>('all');
const showForm = ref(false);
const editingEventId = ref<string | null>(null);
const slideOverEventId = ref<string | null>(null);

const currentFilters = ref<{ search?: string; type?: EventType; tag?: string }>({});
const searchResults = ref<TimelineEvent[] | null>(null);

const displayedEvents = computed(() => {
  let result = searchResults.value !== null ? searchResults.value : events.value;
  if (showMode.value === 'selected' && selectedEventIds.value.length > 0) {
    result = result.filter(e => selectedEventIds.value.includes(e.id));
  }
  return result;
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
  if (!selectedEventIds.value.includes(event.id)) {
    selectedEventIds.value = [...selectedEventIds.value, event.id];
  }
}

function deselectEvent(event: TimelineEvent) {
  selectedEventIds.value = selectedEventIds.value.filter(eid => eid !== event.id);
}

function closeDetail(id: string) {
  selectedEventIds.value = selectedEventIds.value.filter(eid => eid !== id);
}

function closeAllDetails() {
  selectedEventIds.value = [];
}

function sortChronologically() {
  const allEvents = searchResults.value ?? events.value;
  selectedEventIds.value = [...selectedEventIds.value].sort((a, b) => {
    const eventA = allEvents.find(e => e.id === a);
    const eventB = allEvents.find(e => e.id === b);
    if (!eventA || !eventB) return 0;

    const yearA = parseInt(eventA.date_start || '0') * (eventA.is_bce ? -1 : 1);
    const yearB = parseInt(eventB.date_start || '0') * (eventB.is_bce ? -1 : 1);
    return yearA - yearB;
  });
}

function filterByType(type: string) {
  handleFilter({ ...currentFilters.value, type: type as EventType });
}

function filterByTag(tag: string) {
  handleFilter({ ...currentFilters.value, tag });
}

function showSlideOver(eventId: string) {
  slideOverEventId.value = eventId;
}

function closeSlideOver() {
  slideOverEventId.value = null;
}

function navigateSlideOver(eventId: string) {
  slideOverEventId.value = eventId;
  if (!selectedEventIds.value.includes(eventId)) {
    selectedEventIds.value = [...selectedEventIds.value, eventId];
  }
}

function navigateToEvent(event: TimelineEvent) {
  if (!selectedEventIds.value.includes(event.id)) {
    selectedEventIds.value = [...selectedEventIds.value, event.id];
  }
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
  if (editingEventId.value && !selectedEventIds.value.includes(editingEventId.value)) {
    selectedEventIds.value = [...selectedEventIds.value, editingEventId.value];
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (slideOverEventId.value) {
      closeSlideOver();
    } else if (showForm.value) {
      closeForm();
    } else if (selectedEventIds.value.length > 0) {
      closeAllDetails();
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
  <div class="home">
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
          <div class="view-toggle">
            <button
              class="btn"
              :class="showMode === 'all' ? 'btn-active' : 'btn-ghost'"
              @click="showMode = 'all'"
            >
              Show All
            </button>
            <button
              class="btn"
              :class="showMode === 'selected' ? 'btn-active' : 'btn-ghost'"
              :disabled="selectedEventIds.length === 0"
              @click="showMode = 'selected'"
            >
              Show Selected ({{ selectedEventIds.length }})
            </button>
          </div>
          <button class="btn btn-primary" @click="openCreateForm">+ Add Event</button>
        </div>
      </div>
    </header>

    <div v-if="showForm" class="main container">
      <div class="form-overlay">
        <EventForm :event-id="editingEventId" @close="closeForm" @saved="onEventSaved" />
      </div>
    </div>

    <template v-else>
      <div class="filter-bar-container container">
        <FilterBar :type="currentFilters.type" :tag="currentFilters.tag" @filter="handleFilter" />
      </div>

      <div v-if="viewMode === 'timeline'" class="timeline-section">
        <Timeline
          :events="displayedEvents"
          :selected-event-ids="selectedEventIds"
          @select="selectEvent"
          @deselect="deselectEvent"
        />
      </div>

      <template v-if="selectedEventIds.length > 0">
        <div class="details-row-header">
          <button class="btn btn-ghost" @click="sortChronologically">Sort Chronologically</button>
          <button class="btn btn-ghost" @click="closeAllDetails">Clear All</button>
        </div>
        <div class="details-row">
          <EventDetail
            v-for="eventId in selectedEventIds"
            :key="eventId"
            :event-id="eventId"
            @close="closeDetail(eventId)"
            @navigate="navigateToEvent"
            @edit="openEditForm(eventId)"
            @filter-by-type="filterByType"
            @filter-by-tag="filterByTag"
            @show-details="showSlideOver"
          />
        </div>
      </template>

      <main v-if="viewMode === 'list'" class="main container">
        <div class="events-section">
          <EventList :events="displayedEvents" @select="selectEvent" />
        </div>
      </main>
    </template>

    <SlideOver
      v-if="slideOverEventId"
      :event-id="slideOverEventId"
      @close="closeSlideOver"
      @navigate="navigateSlideOver"
    />
  </div>
</template>

<style scoped>
.home {
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

.filter-bar-container {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.timeline-section {
  padding: 0 1.5rem;
}

.main {
  padding-top: 1rem;
  padding-bottom: 2rem;
}

.form-overlay {
  padding: 1rem 0;
}

.details-row-header {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1.5rem 0;
}

.details-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.details-row > * {
  flex: 0 1 350px;
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
