import type { CampusLifeEvent } from '#/lib/campus-life/types'
import type { Locale } from '#/lib/i18n/messages'
import { localeToDateLocale, translate } from '#/lib/i18n/messages'

const EVENT_TIMEZONE = 'Europe/Berlin'

function formattersFor(locale: Locale) {
  const tag = localeToDateLocale(locale)
  return {
    weekday: new Intl.DateTimeFormat(tag, {
      timeZone: EVENT_TIMEZONE,
      weekday: 'short',
    }),
    date: new Intl.DateTimeFormat(tag, {
      timeZone: EVENT_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: new Intl.DateTimeFormat(tag, {
      timeZone: EVENT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    }),
    month: new Intl.DateTimeFormat(tag, {
      timeZone: EVENT_TIMEZONE,
      month: 'short',
    }),
  }
}

type EventFormatters = ReturnType<typeof formattersFor>

const formattersCache = new Map<Locale, EventFormatters>()

function getFormatters(locale: Locale): EventFormatters {
  const cached = formattersCache.get(locale)
  if (cached) return cached
  const created = formattersFor(locale)
  formattersCache.set(locale, created)
  return created
}
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EVENT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Locale-aware date/time labels — avoids SSR/client ICU punctuation differences. */
function formatWeekday(
  formatters: EventFormatters,
  date: Date,
  locale: Locale,
): string {
  const raw = formatters.weekday.format(date).replace(/\.$/, '')
  if (locale === 'en') {
    return raw.replace(/\.$/, '')
  }
  return raw
}

function formatDate(formatters: EventFormatters, date: Date): string {
  return formatters.date.format(date)
}

function formatTime(formatters: EventFormatters, date: Date): string {
  return formatters.time.format(date)
}

function formatDateTime(
  formatters: EventFormatters,
  date: Date,
  locale: Locale,
): string {
  if (locale === 'en') {
    return `${formatWeekday(formatters, date, locale)}, ${formatDate(formatters, date)}, ${formatTime(formatters, date)}`
  }
  return `${formatWeekday(formatters, date, locale)}., ${formatDate(formatters, date)}, ${formatTime(formatters, date)}`
}

function formatDayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}

/** Calendar day key in Europe/Berlin (`YYYY-MM-DD`). */
export function getBerlinDayKey(date: Date = new Date()): string {
  return formatDayKey(date)
}

function timestampOf(iso: string): number | null {
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? null : value
}

export function getEventTimestamp(event: CampusLifeEvent): number | null {
  return timestampOf(event.startDateTime)
}

export function isEventPast(event: CampusLifeEvent, now = Date.now()): boolean {
  const endMs = event.endDateTime ? timestampOf(event.endDateTime) : null
  if (endMs !== null) {
    return endMs < now
  }

  const startMs = getEventTimestamp(event)
  return startMs !== null && startMs < now
}

export function isEventToday(
  event: CampusLifeEvent,
  now = Date.now(),
): boolean {
  const startMs = getEventTimestamp(event)
  if (startMs === null) {
    return false
  }

  const todayKey = formatDayKey(new Date(now))
  const startKey = formatDayKey(new Date(startMs))
  if (startKey === todayKey) {
    return true
  }

  const endMs = event.endDateTime ? timestampOf(event.endDateTime) : null
  if (endMs === null) {
    return false
  }

  const endKey = formatDayKey(new Date(endMs))
  return startKey <= todayKey && todayKey <= endKey
}

export function formatEventDateRange(
  event: CampusLifeEvent,
  fallback = translate('de', 'events.fallbackDate'),
  locale: Locale = 'de',
): string {
  const formatters = getFormatters(locale)
  const startMs = getEventTimestamp(event)
  if (startMs === null) {
    return fallback
  }

  const start = new Date(startMs)
  const label = formatDateTime(formatters, start, locale)

  if (!event.endDateTime) {
    return label
  }

  const endMs = timestampOf(event.endDateTime)
  if (endMs === null) {
    return label
  }

  const end = new Date(endMs)

  if (formatDayKey(start) === formatDayKey(end)) {
    return `${label} – ${formatTime(formatters, end)}`
  }

  return `${label} – ${formatDateTime(formatters, end, locale)}`
}

export function formatEventDayParts(
  event: CampusLifeEvent,
  locale: Locale = 'de',
): {
  day: string
  month: string
} | null {
  const formatters = getFormatters(locale)
  const startMs = getEventTimestamp(event)
  if (startMs === null) {
    return null
  }

  const start = new Date(startMs)
  return {
    day:
      formatters.date.formatToParts(start).find(part => part.type === 'day')
        ?.value ?? '',
    month: formatters.month.format(start).replace(/\.$/, '').toUpperCase(),
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
