<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { EventWithRelations, TimelineEvent } from 'shared/types';
import { RELATIONSHIP_INVERSES } from 'shared/types';
import { api } from '../api/client';

const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [eventId: string];
}>();

const event = ref<EventWithRelations | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const animationState = ref<'entering' | 'visible' | 'leaving'>('entering');

function closeWithAnimation() {
  animationState.value = 'leaving';
  setTimeout(() => {
    emit('close');
  }, 200);
}

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
  () => props.eventId,
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
  emit('navigate', ev.id);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeWithAnimation();
  }
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeWithAnimation();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    animationState.value = 'visible';
  }, 250);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div class="slide-over-backdrop" :class="animationState" @click="handleBackdropClick">
      <div class="slide-over-panel">
        <div class="panel-header">
          <h2 v-if="event" class="panel-title">{{ event.title }}</h2>
          <span v-else class="panel-title">Loading...</span>
          <button class="close-btn" title="Close (Esc)" @click="closeWithAnimation">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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

        <div class="panel-body">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>

          <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
          </div>

          <article v-else-if="event" class="event-article">
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

            <section v-if="event.summary" class="event-summary">
              <p>{{ event.summary }}</p>
            </section>

            <section v-if="event.details" class="event-details">
              <div class="rich-content" v-html="event.details"></div>
            </section>

            <section v-if="event.relationships.length > 0" class="relationships-section">
              <h3 class="section-title">Relationships</h3>
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
              <h3 class="section-title">Referenced By</h3>
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
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.slide-over-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.slide-over-backdrop.entering {
  animation: fade-in 0.2s ease forwards;
}

.slide-over-backdrop.leaving {
  animation: fade-out 0.2s ease forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.slide-over-panel {
  width: 75%;
  max-width: 1200px;
  height: 100%;
  background-color: var(--color-bg-card);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.slide-over-backdrop.entering .slide-over-panel {
  animation: slide-in 0.25s ease forwards;
}

.slide-over-backdrop.leaving .slide-over-panel {
  animation: slide-out 0.2s ease forwards;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-header);
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 1rem;
}

.close-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.error-state {
  color: var(--color-error);
  text-align: center;
  padding: 2rem 0;
}

.event-article {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  border-left: 3px solid var(--color-primary);
  padding-left: 1rem;
  margin: 0;
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

.rich-content :deep(h1:first-child),
.rich-content :deep(h2:first-child),
.rich-content :deep(h3:first-child) {
  margin-top: 0;
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
  padding-top: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
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
  background-color: var(--color-bg);
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
