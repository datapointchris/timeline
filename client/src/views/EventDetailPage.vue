<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { EventWithRelations, TimelineEvent } from 'shared/types';
import { RELATIONSHIP_INVERSES } from 'shared/types';
import { api } from '../api/client';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const event = ref<EventWithRelations | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function fetchEvent(id: string) {
  loading.value = true;
  error.value = null;
  try {
    event.value = await api.events.get(id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch event';
    event.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.id,
  id => {
    if (id) fetchEvent(id);
  },
  { immediate: true }
);

function formatDate(): string {
  if (!event.value) return '';
  const ev = event.value;
  if (ev.date_display) return ev.date_display;
  if (!ev.date_start) return '';

  const prefix = ev.is_bce ? 'BCE ' : '';
  if (ev.date_end && ev.date_end !== ev.date_start) {
    return `${prefix}${ev.date_start} – ${ev.date_end}`;
  }
  return `${prefix}${ev.date_start}`;
}

function formatRelationType(type: string, inverse: boolean): string {
  if (inverse) {
    return RELATIONSHIP_INVERSES[type as keyof typeof RELATIONSHIP_INVERSES] || type;
  }
  return type.replace(/_/g, ' ');
}

function navigateToEvent(ev: TimelineEvent) {
  router.push(`/event/${ev.id}`);
}

function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="event-page">
    <header class="page-header">
      <div class="header-content container">
        <button class="btn btn-ghost back-btn" @click="goBack">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          Back to Timeline
        </button>
      </div>
    </header>

    <main class="page-main container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading event...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" @click="goBack">Return to Timeline</button>
      </div>

      <article v-else-if="event" class="event-article">
        <header class="event-header">
          <h1 class="event-title">{{ event.title }}</h1>

          <div class="event-meta">
            <span v-if="event.type" class="tag" :class="`tag-${event.type}`">
              {{ event.type }}
            </span>
            <span v-if="formatDate()" class="tag tag-other">
              {{ formatDate() }}
            </span>
          </div>

          <div v-if="event.tags.length > 0" class="tags-list">
            <span v-for="tag in event.tags" :key="tag.id" class="tag tag-purple">
              {{ tag.name }}
            </span>
          </div>
        </header>

        <section v-if="event.summary" class="event-summary">
          <p>{{ event.summary }}</p>
        </section>

        <section v-if="event.details" class="event-details">
          <div class="rich-content" v-html="event.details"></div>
        </section>

        <section v-if="event.relationships.length > 0" class="relationships-section">
          <h2 class="section-title">Relationships</h2>
          <div class="relationships-list">
            <button
              v-for="rel in event.relationships"
              :key="rel.id"
              class="relationship-item"
              @click="navigateToEvent(rel.event)"
            >
              <div class="relationship-main">
                <span class="relationship-type">{{ formatRelationType(rel.type, false) }}</span>
                <span class="relationship-target">{{ rel.event.title }}</span>
              </div>
              <span v-if="rel.notes" class="relationship-notes">{{ rel.notes }}</span>
            </button>
          </div>
        </section>

        <section v-if="event.inverse_relationships.length > 0" class="relationships-section">
          <h2 class="section-title">Referenced By</h2>
          <div class="relationships-list">
            <button
              v-for="rel in event.inverse_relationships"
              :key="rel.id"
              class="relationship-item"
              @click="navigateToEvent(rel.event)"
            >
              <div class="relationship-main">
                <span class="relationship-type">{{ formatRelationType(rel.type, true) }}</span>
                <span class="relationship-target">{{ rel.event.title }}</span>
              </div>
              <span v-if="rel.notes" class="relationship-notes">{{ rel.notes }}</span>
            </button>
          </div>
        </section>
      </article>
    </main>
  </div>
</template>

<style scoped>
.event-page {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.page-header {
  background-color: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.header-content {
  padding: 1rem 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-main {
  padding: 2rem 0;
  max-width: 800px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 0;
}

.loading-state p {
  margin-top: 1rem;
  color: var(--color-text-secondary);
}

.error-message {
  color: var(--color-error);
  margin-bottom: 1rem;
}

.event-article {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.event-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.event-summary {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  border-left: 3px solid var(--color-primary);
  padding-left: 1rem;
}

.event-summary p {
  margin: 0;
}

.event-details {
  line-height: 1.7;
}

.rich-content {
  font-size: 1rem;
}

.rich-content :deep(p) {
  margin: 0 0 1rem;
}

.rich-content :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-content :deep(h1),
.rich-content :deep(h2),
.rich-content :deep(h3) {
  margin: 1.5rem 0 0.75rem;
}

.rich-content :deep(ul),
.rich-content :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

.rich-content :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  border-left: 3px solid var(--color-border);
  color: var(--color-text-secondary);
  font-style: italic;
}

.rich-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.relationships-section {
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.relationship-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  padding: 0.75rem;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.relationship-item:hover {
  background-color: var(--color-border);
  border-color: var(--color-primary);
}

.relationship-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.relationship-type {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  min-width: 7.5rem;
}

.relationship-target {
  font-weight: 500;
  color: var(--color-primary);
}

.relationship-notes {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
  padding-left: 8.25rem;
}
</style>
