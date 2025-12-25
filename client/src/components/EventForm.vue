<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEvents } from '../composables/useEvents';
import { api } from '../api/client';
import type {
  CreateEventInput,
  UpdateEventInput,
  EventType,
  DatePrecision,
  Tag,
} from 'shared/types';

const props = defineProps<{
  eventId?: string | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const { selectedEvent, fetchEvent, createEvent, updateEvent } = useEvents();
const isEditing = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const allTags = ref<Tag[]>([]);
const tagInput = ref('');

const form = ref<{
  id: string;
  title: string;
  content: string;
  date_start: string;
  date_end: string;
  date_precision: DatePrecision | '';
  date_display: string;
  is_bce: boolean;
  type: EventType | '';
  tags: string[];
}>({
  id: '',
  title: '',
  content: '',
  date_start: '',
  date_end: '',
  date_precision: '',
  date_display: '',
  is_bce: false,
  type: '',
  tags: [],
});

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
const precisionTypes: DatePrecision[] = [
  'exact',
  'year',
  'decade',
  'century',
  'approximate',
  'uncertain',
];

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
    }),
    Placeholder.configure({
      placeholder: 'Write event description...',
    }),
  ],
  content: '',
  onUpdate: ({ editor }) => {
    form.value.content = editor.getHTML();
  },
});

async function loadTags() {
  try {
    allTags.value = await api.tags.list();
  } catch {
    // Silently ignore tag loading failures
  }
}

function resetForm() {
  form.value = {
    id: '',
    title: '',
    content: '',
    date_start: '',
    date_end: '',
    date_precision: '',
    date_display: '',
    is_bce: false,
    type: '',
    tags: [],
  };
  editor.value?.commands.setContent('');
}

function loadEventData() {
  if (selectedEvent.value) {
    const event = selectedEvent.value;
    form.value = {
      id: event.id,
      title: event.title,
      content: event.content || '',
      date_start: event.date_start || '',
      date_end: event.date_end || '',
      date_precision: event.date_precision || '',
      date_display: event.date_display || '',
      is_bce: event.is_bce,
      type: event.type || '',
      tags: event.tags.map(t => t.name),
    };
    editor.value?.commands.setContent(event.content || '');
    isEditing.value = true;
  }
}

function addTag() {
  const tag = tagInput.value.trim().toLowerCase();
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag);
  }
  tagInput.value = '';
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter(t => t !== tag);
}

function selectSuggestedTag(tag: Tag) {
  if (!form.value.tags.includes(tag.name)) {
    form.value.tags.push(tag.name);
  }
  tagInput.value = '';
}

const filteredTags = ref<Tag[]>([]);
watch(tagInput, value => {
  if (value.trim()) {
    filteredTags.value = allTags.value
      .filter(t => t.name.toLowerCase().includes(value.toLowerCase()))
      .filter(t => !form.value.tags.includes(t.name))
      .slice(0, 5);
  } else {
    filteredTags.value = [];
  }
});

async function handleSubmit() {
  if (!form.value.id || !form.value.title) {
    error.value = 'ID and title are required';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    if (isEditing.value) {
      const data: UpdateEventInput = {
        title: form.value.title,
        content: form.value.content || undefined,
        date_start: form.value.date_start || undefined,
        date_end: form.value.date_end || undefined,
        date_precision: form.value.date_precision || undefined,
        date_display: form.value.date_display || undefined,
        is_bce: form.value.is_bce,
        type: form.value.type || undefined,
      };
      await updateEvent(form.value.id, data);
    } else {
      const data: CreateEventInput = {
        id: form.value.id,
        title: form.value.title,
        content: form.value.content || undefined,
        date_start: form.value.date_start || undefined,
        date_end: form.value.date_end || undefined,
        date_precision: form.value.date_precision || undefined,
        date_display: form.value.date_display || undefined,
        is_bce: form.value.is_bce,
        type: form.value.type || undefined,
        tags: form.value.tags.length > 0 ? form.value.tags : undefined,
      };
      await createEvent(data);
    }
    emit('saved');
    emit('close');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save event';
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.eventId,
  async id => {
    if (id) {
      await fetchEvent(id);
      loadEventData();
    } else {
      resetForm();
      isEditing.value = false;
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadTags();
});
</script>

<template>
  <div class="event-form card">
    <div class="form-header">
      <h2 class="form-title">{{ isEditing ? 'Edit Event' : 'Create Event' }}</h2>
      <button class="close-btn" @click="emit('close')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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

    <form class="form-body" @submit.prevent="handleSubmit">
      <div v-if="error" class="error-box">{{ error }}</div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="event-id">ID</label>
          <input
            id="event-id"
            v-model="form.id"
            type="text"
            class="form-input"
            placeholder="unique-event-id"
            :disabled="isEditing"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="event-type">Type</label>
          <select id="event-type" v-model="form.type" class="form-input">
            <option value="">Select type...</option>
            <option v-for="t in eventTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="event-title">Title</label>
        <input
          id="event-title"
          v-model="form.title"
          type="text"
          class="form-input"
          placeholder="Event title"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Content</label>
        <div class="editor-wrapper">
          <div class="editor-toolbar">
            <button
              type="button"
              class="toolbar-btn"
              :class="{ active: editor?.isActive('bold') }"
              @click="editor?.chain().focus().toggleBold().run()"
            >
              B
            </button>
            <button
              type="button"
              class="toolbar-btn"
              :class="{ active: editor?.isActive('italic') }"
              @click="editor?.chain().focus().toggleItalic().run()"
            >
              I
            </button>
            <button
              type="button"
              class="toolbar-btn"
              :class="{ active: editor?.isActive('heading', { level: 2 }) }"
              @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
              H2
            </button>
            <button
              type="button"
              class="toolbar-btn"
              :class="{ active: editor?.isActive('bulletList') }"
              @click="editor?.chain().focus().toggleBulletList().run()"
            >
              List
            </button>
          </div>
          <EditorContent :editor="editor" class="editor-content" />
        </div>
      </div>

      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label" for="date-start">Start Date</label>
          <input
            id="date-start"
            v-model="form.date_start"
            type="text"
            class="form-input"
            placeholder="1886 or 1886-07-04"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="date-end">End Date</label>
          <input
            id="date-end"
            v-model="form.date_end"
            type="text"
            class="form-input"
            placeholder="Optional"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="date-precision">Precision</label>
          <select id="date-precision" v-model="form.date_precision" class="form-input">
            <option value="">Select...</option>
            <option v-for="p in precisionTypes" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="date-display">Display Date</label>
          <input
            id="date-display"
            v-model="form.date_display"
            type="text"
            class="form-input"
            placeholder="e.g., c. 500 BCE"
          />
        </div>
        <div class="form-group form-checkbox">
          <input id="is-bce" v-model="form.is_bce" type="checkbox" />
          <label for="is-bce">BCE (Before Common Era)</label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Tags</label>
        <div class="tags-input-wrapper">
          <div class="selected-tags">
            <span v-for="tag in form.tags" :key="tag" class="tag tag-purple">
              {{ tag }}
              <button type="button" class="tag-remove" @click="removeTag(tag)">&times;</button>
            </span>
          </div>
          <div class="tag-autocomplete">
            <input
              v-model="tagInput"
              type="text"
              class="form-input"
              placeholder="Add tag..."
              @keydown.enter.prevent="addTag"
            />
            <div v-if="filteredTags.length > 0" class="tag-suggestions">
              <button
                v-for="tag in filteredTags"
                :key="tag.id"
                type="button"
                class="tag-suggestion"
                @click="selectSuggestedTag(tag)"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.event-form {
  max-width: 48rem;
  margin: 0 auto;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}

.close-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}

.form-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
}

.form-row-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

@media (max-width: 640px) {
  .form-row,
  .form-row-3 {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-bg-card);
  color: var(--color-text);
  transition: border-color 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1.5rem;
}

.form-checkbox input {
  width: 1rem;
  height: 1rem;
}

.form-checkbox label {
  font-size: 0.875rem;
  color: var(--color-text);
}

.editor-wrapper {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.toolbar-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.toolbar-btn:hover {
  background-color: var(--color-border);
}

.toolbar-btn.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.editor-content {
  min-height: 8rem;
  padding: 0.75rem;
}

.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 6rem;
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-muted);
  pointer-events: none;
  height: 0;
}

.tags-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-remove {
  margin-left: 0.25rem;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.tag-autocomplete {
  position: relative;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  z-index: 10;
}

.tag-suggestion {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.tag-suggestion:hover {
  background-color: var(--color-bg);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}
</style>
