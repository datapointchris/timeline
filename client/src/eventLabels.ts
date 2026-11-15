import type { TimelineEvent } from 'shared/types'
import { RELATIONSHIP_INVERSES } from 'shared/types'

/**
 * The date line shown for an event: its free-text date_display when set, otherwise its start
 * date, or its start and end when they differ, prefixed with BCE where it applies.
 */
export function formatEventDate(event: TimelineEvent): string {
  if (event.date_display) return event.date_display
  if (!event.date_start) return ''

  const prefix = event.is_bce ? 'BCE ' : ''
  if (event.date_end && event.date_end !== event.date_start) {
    return `${prefix}${event.date_start} – ${event.date_end}`
  }
  return `${prefix}${event.date_start}`
}

/**
 * The label for a relationship type. An outgoing relationship reads as its type with spaces;
 * an incoming one (`inverse`) reads as the inverse label, so "influenced_by" seen from its
 * target reads "influenced".
 */
export function formatRelationType(type: string, inverse: boolean): string {
  if (inverse) {
    return RELATIONSHIP_INVERSES[type as keyof typeof RELATIONSHIP_INVERSES] || type
  }
  return type.replace(/_/g, ' ')
}
