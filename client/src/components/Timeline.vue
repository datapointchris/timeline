<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data/standalone';
import type { TimelineEvent } from 'shared/types';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

const props = defineProps<{
  events: readonly TimelineEvent[];
  selectedEventIds?: string[];
}>();

const emit = defineEmits<{
  select: [event: TimelineEvent];
  deselect: [event: TimelineEvent];
}>();

const containerRef = ref<HTMLDivElement | null>(null);

let timeline: Timeline | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let items: DataSet<any> | null = null;
let hasInitialFit = false;

interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  title?: string;
  type: 'box';
}

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

    const dateStr =
      event.date_display ||
      (event.date_end && event.date_end !== event.date_start
        ? `${event.date_start}–${event.date_end}${event.is_bce ? ' BCE' : ''}`
        : `${event.date_start}${event.is_bce ? ' BCE' : ''}`);

    const item: TimelineItem = {
      id: event.id,
      content: event.title,
      start,
      title: `${event.title}\n${dateStr}`,
      type: 'box',
    };

    result.push(item);
  }
  return result;
}

function initTimeline() {
  if (!containerRef.value) return;

  items = new DataSet(eventsToItems(props.events));

  // Set min/max to allow BCE dates
  const minDate = new Date(-1000, 0, 1); // 1000 BCE
  const maxDate = new Date(2100, 0, 1); // 2100 CE

  const options = {
    height: '400px',
    minHeight: '300px',
    maxHeight: '600px',
    min: minDate,
    max: maxDate,
    zoomMin: 1000 * 60 * 60 * 24 * 365, // 1 year minimum zoom
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 3000, // 3000 years maximum zoom (for BCE to modern)
    zoomFriction: 10, // Slower zoom for smoother control
    moveable: true, // Click and drag to pan
    zoomable: true, // Scroll to zoom
    align: 'left' as const, // Left edge of box aligns with start date
    orientation: { axis: 'bottom' as const, item: 'bottom' as const },
    stack: true,
    stackSubgroups: true,
    showCurrentTime: false,
    format: {
      minorLabels: {
        millisecond: 'SSS',
        second: 's',
        minute: 'HH:mm',
        hour: 'HH:mm',
        weekday: 'ddd D',
        day: 'D',
        week: 'w',
        month: 'MMM',
        year: 'YYYY',
      },
      majorLabels: {
        millisecond: 'HH:mm:ss',
        second: 'D MMMM HH:mm',
        minute: 'ddd D MMMM',
        hour: 'ddd D MMMM',
        weekday: 'MMMM YYYY',
        day: 'MMMM YYYY',
        week: 'MMMM YYYY',
        month: 'YYYY',
        year: 'YYYY',
      },
    },
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap' as const,
      delay: 0,
    },
  };

  timeline = new Timeline(containerRef.value, items, options);

  // Ctrl+scroll to pan horizontally
  containerRef.value.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      if (e.ctrlKey && timeline) {
        e.preventDefault();
        e.stopPropagation();
        const win = timeline.getWindow();
        const range = win.end.getTime() - win.start.getTime();
        const delta = (e.deltaY / 300) * range;
        timeline.setWindow(
          new Date(win.start.getTime() + delta),
          new Date(win.end.getTime() + delta),
          { animation: false }
        );
      }
    },
    { passive: false, capture: true }
  );

  timeline.on('select', (properties: { items: string[] }) => {
    if (properties.items.length > 0) {
      const eventId = properties.items[0];
      const event = props.events.find(e => e.id === eventId);
      if (event) {
        if (props.selectedEventIds?.includes(eventId)) {
          emit('deselect', event);
        } else {
          emit('select', event);
        }
      }
    }
  });

  if (props.events.length > 0) {
    nextTick(() => {
      timeline?.fit();
    });
  }
}

watch(
  () => props.events,
  newEvents => {
    if (items && timeline) {
      items.clear();
      items.add(eventsToItems(newEvents));
      // Re-apply selection after updating items
      timeline.setSelection(props.selectedEventIds || []);
      // Fit to all events on first load only
      if (!hasInitialFit && newEvents.length > 0) {
        hasInitialFit = true;
        nextTick(() => {
          timeline?.fit();
        });
      }
    }
  },
  { deep: true }
);

watch(
  () => props.selectedEventIds,
  ids => {
    if (timeline) {
      timeline.setSelection(ids || []);
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
  <div class="timeline-wrapper">
    <div ref="containerRef" class="timeline-container"></div>
  </div>
</template>

<style>
.timeline-wrapper {
  --vis-font: inherit;
  overflow: hidden;
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
  border-radius: 3px;
  border-width: 1px;
  font-size: 0.75rem;
  padding: 1px 6px;
  min-width: 80px !important;
  background-color: #dbeafe;
  border-color: #3b82f6;
  color: #6b7280;
}

.vis-item .vis-item-overflow {
  overflow: visible;
}

.vis-item.vis-box .vis-box {
  border: none !important;
}

.vis-item.vis-line {
  display: none !important;
}

.vis-item.vis-dot {
  display: none !important;
}

.vis-item.vis-selected,
.vis-item.vis-selected.vis-box {
  background-color: #dcfce7 !important;
  border-color: #22c55e !important;
  color: #166534 !important;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.4) !important;
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
