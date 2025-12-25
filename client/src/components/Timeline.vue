<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data/standalone';
import type { TimelineEvent } from 'shared/types';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

const props = defineProps<{
  events: readonly TimelineEvent[];
  selectedEventId?: string | null;
}>();

const emit = defineEmits<{
  select: [event: TimelineEvent];
}>();

const containerRef = ref<HTMLDivElement | null>(null);

let timeline: Timeline | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let items: DataSet<any> | null = null;

interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  end?: Date;
  className?: string;
  title?: string;
}

const typeColors: Record<string, string> = {
  book: 'timeline-book',
  person: 'timeline-person',
  event: 'timeline-event',
  movement: 'timeline-movement',
  idea: 'timeline-idea',
  artwork: 'timeline-artwork',
  invention: 'timeline-invention',
  other: 'timeline-other',
};

function parseDate(dateStr: string | null, isBce: boolean): Date | null {
  if (!dateStr) return null;

  let year: number;
  let month = 0;
  let day = 1;

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    if (parts[1]) month = parseInt(parts[1], 10) - 1;
    if (parts[2]) day = parseInt(parts[2], 10);
  } else {
    year = parseInt(dateStr, 10);
  }

  if (isBce) {
    year = -year + 1;
  }

  const date = new Date(year, month, day);
  date.setFullYear(year);
  return date;
}

function eventsToItems(events: readonly TimelineEvent[]) {
  const result: TimelineItem[] = [];
  for (const event of events) {
    if (!event.date_start) continue;
    const start = parseDate(event.date_start, event.is_bce);
    if (!start) continue;

    const end = parseDate(event.date_end, event.is_bce);
    const item: TimelineItem = {
      id: event.id,
      content: event.title,
      start,
      className: typeColors[event.type || 'other'] || 'timeline-other',
      title: event.date_display || event.date_start || '',
    };

    if (end && end.getTime() !== start.getTime()) {
      item.end = end;
    }

    result.push(item);
  }
  return result;
}

function initTimeline() {
  if (!containerRef.value) return;

  items = new DataSet(eventsToItems(props.events));

  const options = {
    height: '400px',
    minHeight: '300px',
    maxHeight: '600px',
    zoomMin: 1000 * 60 * 60 * 24 * 30,
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 1000,
    orientation: { axis: 'bottom' as const, item: 'top' as const },
    stack: true,
    stackSubgroups: true,
    showCurrentTime: false,
    format: {
      minorLabels: {
        year: 'YYYY',
      },
      majorLabels: {
        year: 'YYYY',
      },
    },
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap' as const,
    },
  };

  timeline = new Timeline(containerRef.value, items, options);

  timeline.on('select', (properties: { items: string[] }) => {
    if (properties.items.length > 0) {
      const eventId = properties.items[0];
      const event = props.events.find(e => e.id === eventId);
      if (event) {
        emit('select', event);
      }
    }
  });

  if (props.events.length > 0) {
    timeline.fit();
  }
}

watch(
  () => props.events,
  newEvents => {
    if (items) {
      items.clear();
      items.add(eventsToItems(newEvents));
      if (timeline && newEvents.length > 0) {
        timeline.fit();
      }
    }
  },
  { deep: true }
);

watch(
  () => props.selectedEventId,
  id => {
    if (timeline && id) {
      timeline.setSelection([id]);
      timeline.focus(id);
    } else if (timeline) {
      timeline.setSelection([]);
    }
  }
);

onMounted(() => {
  initTimeline();
});

onUnmounted(() => {
  if (timeline) {
    timeline.destroy();
    timeline = null;
  }
});
</script>

<template>
  <div
    class="timeline-wrapper bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <div ref="containerRef" class="timeline-container"></div>
  </div>
</template>

<style>
.timeline-wrapper {
  --vis-font: inherit;
}

.vis-timeline {
  font-family: inherit;
  border: none !important;
}

.vis-panel.vis-center,
.vis-panel.vis-left,
.vis-panel.vis-right,
.vis-panel.vis-top,
.vis-panel.vis-bottom {
  border: none !important;
}

.vis-item {
  border-radius: 4px;
  border-width: 1px;
  font-size: 0.875rem;
  padding: 2px 8px;
}

.vis-item.vis-selected {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.vis-item.timeline-book {
  background-color: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.vis-item.timeline-person {
  background-color: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.vis-item.timeline-event {
  background-color: #fef9c3;
  border-color: #eab308;
  color: #854d0e;
}

.vis-item.timeline-movement {
  background-color: #f3e8ff;
  border-color: #a855f7;
  color: #6b21a8;
}

.vis-item.timeline-idea {
  background-color: #fce7f3;
  border-color: #ec4899;
  color: #9d174d;
}

.vis-item.timeline-artwork {
  background-color: #e0e7ff;
  border-color: #6366f1;
  color: #3730a3;
}

.vis-item.timeline-invention {
  background-color: #ffedd5;
  border-color: #f97316;
  color: #9a3412;
}

.vis-item.timeline-other {
  background-color: #f3f4f6;
  border-color: #6b7280;
  color: #374151;
}

.vis-time-axis .vis-text {
  color: #6b7280;
  font-size: 0.75rem;
}

.vis-time-axis .vis-grid.vis-minor {
  border-color: #e5e7eb;
}

.vis-time-axis .vis-grid.vis-major {
  border-color: #d1d5db;
}

@media (prefers-color-scheme: dark) {
  .vis-time-axis .vis-text {
    color: #9ca3af;
  }

  .vis-time-axis .vis-grid.vis-minor {
    border-color: #374151;
  }

  .vis-time-axis .vis-grid.vis-major {
    border-color: #4b5563;
  }

  .vis-panel.vis-background {
    background-color: #1f2937;
  }
}
</style>
