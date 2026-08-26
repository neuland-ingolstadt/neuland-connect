import { fetchNeulandEvents } from '#/lib/campus-life/client'
import {
  formatEventDateRange,
  getBerlinDayKey,
  getEventTimestamp,
  isEventToday,
} from '#/lib/campus-life/format'
import type { CampusLifeEvent } from '#/lib/campus-life/types'
import { serverConfig } from '#/lib/config'
import {
  createChannelMessage,
  listChannelMessages,
} from '#/lib/integrations/discord/guild'
import { isDiscordSnowflake } from '#/lib/integrations/discord/snowflake'

/** Marker for idempotency — stored in embed URL query, not visible as footer spam. */
const DIGEST_MARKER_PREFIX = 'neuland-events:'
const CONNECT_URL = 'https://connect.neuland.ing'

/** Neuland accent for embeds */
const EMBED_COLOR = 0x2d8a5e

const DISCORD_COMPONENT_TYPES = {
  ACTION_ROW: 1,
  BUTTON: 2,
} as const

const DISCORD_BUTTON_STYLES = {
  LINK: 5,
} as const

const EVENT_TIMEZONE = 'Europe/Berlin'
const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  timeZone: EVENT_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})
const weekdayFormatter = new Intl.DateTimeFormat('de-DE', {
  timeZone: EVENT_TIMEZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export type EventsNotifyResult = {
  configured: boolean
  dayKey: string
  eventsToday: number
  posted: boolean
  skippedReason:
    | 'not_configured'
    | 'no_events'
    | 'already_posted'
    | 'fetch_failed'
    | null
}

function digestMarker(dayKey: string): string {
  return `${DIGEST_MARKER_PREFIX}${dayKey}`
}

function digestEmbedUrl(dayKey: string): string {
  return `${CONNECT_URL}/?${digestMarker(dayKey)}`
}

function messageHasDigestMarker(
  message: {
    content: string
    embeds?: Array<{ url?: string; footer?: { text?: string } }>
  },
  marker: string,
): boolean {
  if (message.content.includes(marker)) {
    return true
  }

  return (message.embeds ?? []).some(embed => {
    if (embed.url?.includes(marker)) {
      return true
    }
    return embed.footer?.text?.includes(marker) === true
  })
}

function formatTime(iso: string): string | null {
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) {
    return null
  }
  return timeFormatter.format(new Date(ms))
}

/** Prefer compact time range for same-day events; fall back to full date range. */
function formatEventSchedule(event: CampusLifeEvent, dayKey: string): string {
  const startMs = getEventTimestamp(event)
  if (startMs === null) {
    return formatEventDateRange(event)
  }

  const startKey = getBerlinDayKey(new Date(startMs))
  const endMs = event.endDateTime ? new Date(event.endDateTime).getTime() : null
  const endValid = endMs !== null && !Number.isNaN(endMs)
  const endKey = endValid ? getBerlinDayKey(new Date(endMs)) : null

  if (startKey === dayKey && (!endKey || endKey === dayKey)) {
    const startTime = formatTime(event.startDateTime)
    if (!startTime) {
      return formatEventDateRange(event)
    }
    if (event.endDateTime) {
      const endTime = formatTime(event.endDateTime)
      if (endTime) {
        return `${startTime} – ${endTime}`
      }
    }
    return startTime
  }

  return formatEventDateRange(event)
}

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  const cut = normalized.slice(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${trimmed}…`
}

function formatEventBlock(event: CampusLifeEvent, dayKey: string): string {
  const schedule = formatEventSchedule(event, dayKey)
  const lines = [`**${event.title}**`, schedule]
  if (event.location) {
    lines.push(event.location)
  }
  if (event.description.trim()) {
    lines.push(`*${truncateText(event.description, 160)}*`)
  }
  return lines.join('\n')
}

function formatDisplayDate(dayKey: string, now: number): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  if (!year || !month || !day) {
    return weekdayFormatter.format(new Date(now))
  }
  // Noon UTC avoids DST edge cases when formatting the Berlin calendar day.
  return weekdayFormatter.format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function buildDigestPayload(
  events: CampusLifeEvent[],
  dayKey: string,
  now: number,
) {
  const displayDate = formatDisplayDate(dayKey, now)
  const countLabel =
    events.length === 1 ? '1 Event' : `${events.length} Events`

  const description = events
    .slice(0, 25)
    .map(event => formatEventBlock(event, dayKey))
    .join('\n\n')

  return {
    content: '🌴 Das steht heute an:',
    embeds: [
      {
        title: countLabel,
        description:
          description.length > 4096
            ? `${description.slice(0, 4093)}...`
            : description,
        url: digestEmbedUrl(dayKey),
        color: EMBED_COLOR,
        footer: {
          text: displayDate,
        },
      },
    ],
    components: [
      {
        type: DISCORD_COMPONENT_TYPES.ACTION_ROW,
        components: [
          {
            type: DISCORD_COMPONENT_TYPES.BUTTON,
            style: DISCORD_BUTTON_STYLES.LINK,
            label: 'Neuland Connect',
            url: CONNECT_URL,
          },
        ],
      },
    ],
  }
}

/**
 * Post today's Campus Life events to the configured Discord channel.
 * Idempotent: if a bot digest for the Berlin calendar day already exists, skips.
 */
export async function notifyTodaysEvents(
  now = Date.now(),
): Promise<EventsNotifyResult> {
  const dayKey = getBerlinDayKey(new Date(now))
  const channelId = serverConfig.discord.eventsChannelId

  if (!channelId || !isDiscordSnowflake(channelId)) {
    return {
      configured: false,
      dayKey,
      eventsToday: 0,
      posted: false,
      skippedReason: 'not_configured',
    }
  }

  if (!serverConfig.campusLife.isConfigured) {
    return {
      configured: false,
      dayKey,
      eventsToday: 0,
      posted: false,
      skippedReason: 'not_configured',
    }
  }

  const { events, error } = await fetchNeulandEvents()
  if (error) {
    return {
      configured: true,
      dayKey,
      eventsToday: 0,
      posted: false,
      skippedReason: 'fetch_failed',
    }
  }

  const todaysEvents = events.filter(event => isEventToday(event, now))
  if (todaysEvents.length === 0) {
    return {
      configured: true,
      dayKey,
      eventsToday: 0,
      posted: false,
      skippedReason: 'no_events',
    }
  }

  const marker = digestMarker(dayKey)
  const recent = await listChannelMessages(channelId, 50)
  const alreadyPosted = recent.some(message =>
    messageHasDigestMarker(message, marker),
  )

  if (alreadyPosted) {
    return {
      configured: true,
      dayKey,
      eventsToday: todaysEvents.length,
      posted: false,
      skippedReason: 'already_posted',
    }
  }

  await createChannelMessage(
    channelId,
    buildDigestPayload(todaysEvents, dayKey, now),
  )

  return {
    configured: true,
    dayKey,
    eventsToday: todaysEvents.length,
    posted: true,
    skippedReason: null,
  }
}
