<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { api } from '../api/client';
import type { TimelineEvent, RelationshipType, CreateRelationshipInput } from 'shared/types';

const props = defineProps<{
  sourceEventId: string;
  existingTargetIds: string[];
}>();

const emit = defineEmits<{
  add: [relationship: CreateRelationshipInput];
  cancel: [];
}>();

const searchQuery = ref('');
const searchResults = ref<TimelineEvent[]>([]);
const selectedEvent = ref<TimelineEvent | null>(null);
const selectedType = ref<RelationshipType>('related');
const notes = ref('');
const searching = ref(false);
const error = ref<string | null>(null);

const relationshipTypes: { value: RelationshipType; label: string; description: string }[] = [
  {
    value: 'influenced_by',
    label: 'Influenced by',
    description: 'This event was influenced by the target',
  },
  { value: 'caused', label: 'Caused', description: 'This event caused the target event' },
  {
    value: 'contemporary_with',
    label: 'Contemporary with',
    description: 'These events occurred in the same era',
  },
  { value: 'preceded', label: 'Preceded', description: 'This event came before the target' },
  {
    value: 'part_of',
    label: 'Part of',
    description: 'This event belongs to a larger series/movement',
  },
  { value: 'related', label: 'Related to', description: 'General connection' },
  {
    value: 'response_to',
    label: 'Response to',
    description: 'This event was created in reaction to the target',
  },
];

const filteredResults = computed(() => {
  return searchResults.value.filter(
    e => e.id !== props.sourceEventId && !props.existingTargetIds.includes(e.id)
  );
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, query => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!query.trim()) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    searching.value = true;
    try {
      searchResults.value = await api.events.search(query);
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  }, 300);
});

function selectEvent(event: TimelineEvent) {
  selectedEvent.value = event;
  searchQuery.value = '';
  searchResults.value = [];
}

function clearSelection() {
  selectedEvent.value = null;
}

function handleAdd() {
  if (!selectedEvent.value) {
    error.value = 'Please select an event';
    return;
  }

  emit('add', {
    source_id: props.sourceEventId,
    target_id: selectedEvent.value.id,
    type: selectedType.value,
    notes: notes.value.trim() || undefined,
  });

  selectedEvent.value = null;
  selectedType.value = 'related';
  notes.value = '';
  error.value = null;
}
</script>

<template>
  <div class="relationship-picker">
    <h4 class="picker-title">Add Relationship</h4>

    <div v-if="error" class="error-box error-small">{{ error }}</div>

    <div v-if="!selectedEvent" class="search-section">
      <label class="form-label">Search for event</label>
      <div class="search-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          class="form-input"
          placeholder="Type to search events..."
        />
        <div v-if="searching" class="search-spinner"></div>
      </div>

      <div v-if="filteredResults.length > 0" class="search-results">
        <button
          v-for="event in filteredResults"
          :key="event.id"
          type="button"
          class="search-result"
          @click="selectEvent(event)"
        >
          <span class="result-title">{{ event.title }}</span>
          <span v-if="event.type" class="result-type">{{ event.type }}</span>
        </button>
      </div>

      <p v-else-if="searchQuery && !searching && searchResults.length === 0" class="no-results">
        No events found
      </p>
    </div>

    <div v-else class="selected-section">
      <label class="form-label">Selected event</label>
      <div class="selected-event">
        <div class="selected-info">
          <span class="selected-title">{{ selectedEvent.title }}</span>
          <span v-if="selectedEvent.type" class="tag" :class="`tag-${selectedEvent.type}`">
            {{ selectedEvent.type }}
          </span>
        </div>
        <button type="button" class="clear-btn" @click="clearSelection">&times;</button>
      </div>
    </div>

    <div v-if="selectedEvent" class="type-section">
      <label class="form-label" for="rel-type">Relationship type</label>
      <select id="rel-type" v-model="selectedType" class="form-input">
        <option v-for="rt in relationshipTypes" :key="rt.value" :value="rt.value">
          {{ rt.label }}
        </option>
      </select>
      <p class="type-description">
        {{ relationshipTypes.find(rt => rt.value === selectedType)?.description }}
      </p>
    </div>

    <div v-if="selectedEvent" class="notes-section">
      <label class="form-label" for="rel-notes">Notes (optional)</label>
      <textarea
        id="rel-notes"
        v-model="notes"
        class="form-input notes-input"
        placeholder="Add context about this relationship..."
        rows="2"
      ></textarea>
    </div>

    <div class="picker-actions">
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">Cancel</button>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        :disabled="!selectedEvent"
        @click="handleAdd"
      >
        Add Relationship
      </button>
    </div>
  </div>
</template>

<style scoped>
.relationship-picker {
  padding: 1rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.picker-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.error-small {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.search-wrapper {
  position: relative;
}

.search-spinner {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.search-results {
  margin-top: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-bg-card);
  max-height: 12rem;
  overflow-y: auto;
}

.search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.search-result:last-child {
  border-bottom: none;
}

.search-result:hover {
  background-color: var(--color-bg);
}

.result-title {
  font-size: 0.875rem;
  font-weight: 500;
}

.result-type {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.no-results {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.selected-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selected-title {
  font-size: 0.875rem;
  font-weight: 500;
}

.clear-btn {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--color-text);
}

.type-description {
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.notes-input {
  resize: vertical;
  min-height: 3rem;
}

.picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
