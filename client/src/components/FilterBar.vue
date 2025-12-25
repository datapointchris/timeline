<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { api } from '../api/client';
import type { Tag, EventType } from 'shared/types';

const emit = defineEmits<{
  filter: [params: { search?: string; type?: EventType; tag?: string }];
}>();

const searchQuery = ref('');
const selectedType = ref<EventType | ''>('');
const selectedTag = ref('');
const allTags = ref<Tag[]>([]);

const eventTypes: EventType[] = [
  'book',
  'person',
  'event',
  'movement',
  'idea',
  'artwork',
  'invention',
  'other',
];

async function loadTags() {
  try {
    allTags.value = await api.tags.list();
  } catch {
    allTags.value = [];
  }
}

function emitFilter() {
  emit('filter', {
    search: searchQuery.value.trim() || undefined,
    type: selectedType.value || undefined,
    tag: selectedTag.value || undefined,
  });
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(emitFilter, 300);
});

watch([selectedType, selectedTag], emitFilter);

function clearFilters() {
  searchQuery.value = '';
  selectedType.value = '';
  selectedTag.value = '';
  emitFilter();
}

const hasActiveFilters = ref(false);
watch(
  [searchQuery, selectedType, selectedTag],
  ([search, type, tag]) => {
    hasActiveFilters.value = !!(search || type || tag);
  },
  { immediate: true }
);

onMounted(() => {
  loadTags();
});
</script>

<template>
  <div class="filter-bar">
    <div class="filter-group search-group">
      <div class="search-input-wrapper">
        <svg
          class="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search events..."
        />
      </div>
    </div>

    <div class="filter-group">
      <select v-model="selectedType" class="filter-select">
        <option value="">All types</option>
        <option v-for="t in eventTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div class="filter-group">
      <select v-model="selectedTag" class="filter-select">
        <option value="">All tags</option>
        <option v-for="tag in allTags" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
      </select>
    </div>

    <button v-if="hasActiveFilters" type="button" class="clear-btn" @click="clearFilters">
      Clear
    </button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.filter-group {
  display: flex;
  align-items: center;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-bg);
  color: var(--color-text);
  transition: border-color 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.filter-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M3 4.5L6 7.5 9 4.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background-color: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-btn:hover {
  background-color: var(--color-bg);
  color: var(--color-text);
}

@media (max-width: 640px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
