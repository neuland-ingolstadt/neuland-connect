import type { CampusLifeEvent } from '#/lib/campus-life/types'

const EVENT_TIMEZONE = 'Europe/Berlin'
const LOCALE = 'de-DE'

function timestampOf(iso: string): number | null {
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? null : value
}

export function getEventTimestamp(event: CampusLifeEvent): number | null {
  return timestampOf(event.startDateTime)
}

export function isEventPast(event: CampusLifeEvent, now = Date.now()): boolean {
  const timestamp = getEventTimestamp(event)
  return timestamp !== null && timestamp < now
}

export function isRecentPastEvent(
  event: CampusLifeEvent,
  monthsBack = 2,
  now = Date.now(),
): boolean {
  const timestamp = getEventTimestamp(event)
  if (timestamp === null || timestamp >= now) {
    return false
  }

  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - monthsBack)
  return timestamp >= cutoff.getTime()
}

export function formatEventDateRange(
  event: CampusLifeEvent,
  fallback = 'Termin folgt',
): string {
  const startMs = getEventTimestamp(event)
  if (startMs === null) {
    return fallback
  }

  const start = new Date(startMs)
  const fullFormatter = new Intl.DateTimeFormat(LOCALE, {
    timeZone: EVENT_TIMEZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
    timeZone: EVENT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })

  const label = fullFormatter.format(start)

  if (!event.endDateTime) {
    return label
  }

  const endMs = timestampOf(event.endDateTime)
  if (endMs === null) {
    return label
  }

  const end = new Date(endMs)
  const dayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  if (dayFormatter.format(start) === dayFormatter.format(end)) {
    return `${label} – ${timeFormatter.format(end)}`
  }

  return `${label} – ${fullFormatter.format(end)}`
}

export function formatEventDayParts(event: CampusLifeEvent): {
  day: string
  month: string
} | null {
  const startMs = getEventTimestamp(event)
  if (startMs === null) {
    return null
  }

  const start = new Date(startMs)
  return {
    day: new Intl.DateTimeFormat(LOCALE, {
      timeZone: EVENT_TIMEZONE,
      day: '2-digit',
    }).format(start),
    month: new Intl.DateTimeFormat(LOCALE, {
      timeZone: EVENT_TIMEZONE,
      month: 'short',
    })
      .format(start)
      .replace(/\.$/, '')
      .toUpperCase(),
  }
}

export function sortEvents(
  events: CampusLifeEvent[],
  timeFilter: 'upcoming' | 'past',
): CampusLifeEvent[] {
  return [...events].sort((a, b) => {
    const aTimestamp = getEventTimestamp(a)
    const bTimestamp = getEventTimestamp(b)
    const aValid = aTimestamp !== null
    const bValid = bTimestamp !== null

    if (!aValid && !bValid) {
      return a.id - b.id
    }
    if (!aValid) {
      return 1
    }
    if (!bValid) {
      return -1
    }

    if (timeFilter === 'past') {
      return bTimestamp - aTimestamp
    }

    return aTimestamp - bTimestamp
  })
}
