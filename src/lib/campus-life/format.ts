import type { CampusLifeEvent } from '#/lib/campus-life/types'

const EVENT_TIMEZONE = 'Europe/Berlin'
const LOCALE = 'de-DE'

const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: EVENT_TIMEZONE,
  weekday: 'short',
})
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: EVENT_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: EVENT_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})
const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: EVENT_TIMEZONE,
  month: 'short',
})
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EVENT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Stable de-DE date/time labels — avoids SSR/client ICU punctuation differences. */
function formatGermanWeekday(date: Date): string {
  return weekdayFormatter.format(date).replace(/\.$/, '')
}

function formatGermanDate(date: Date): string {
  return dateFormatter.format(date)
}

function formatGermanTime(date: Date): string {
  return timeFormatter.format(date)
}

function formatGermanDateTime(date: Date): string {
  return `${formatGermanWeekday(date)}., ${formatGermanDate(date)}, ${formatGermanTime(date)}`
}

function formatDayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}

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
  const label = formatGermanDateTime(start)

  if (!event.endDateTime) {
    return label
  }

  const endMs = timestampOf(event.endDateTime)
  if (endMs === null) {
    return label
  }

  const end = new Date(endMs)

  if (formatDayKey(start) === formatDayKey(end)) {
    return `${label} – ${formatGermanTime(end)}`
  }

  return `${label} – ${formatGermanDateTime(end)}`
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
    day:
      dateFormatter.formatToParts(start).find(part => part.type === 'day')
        ?.value ?? '',
    month: monthFormatter.format(start).replace(/\.$/, '').toUpperCase(),
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
