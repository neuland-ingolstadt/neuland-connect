export type CampusLifeEvent = {
  id: number
  title: string
  description: string
  location: string
  startDateTime: string
  endDateTime: string | null
  eventUrl: string | null
  isInternal: boolean
}

export type CampusLifeEventsResult = {
  events: CampusLifeEvent[]
  error: string | null
}

type CampusLifeApiEvent = {
  id?: unknown
  title_de?: unknown
  title_en?: unknown
  description_de?: unknown
  description_en?: unknown
  location?: unknown
  start_date_time?: unknown
  end_date_time?: unknown
  event_url?: unknown
  is_internal?: unknown
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

export function mapCampusLifeApiEvent(
  raw: CampusLifeApiEvent,
): CampusLifeEvent | null {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id)
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  const startDateTime = readString(raw.start_date_time)
  if (!startDateTime) {
    return null
  }

  const title =
    readString(raw.title_de) ?? readString(raw.title_en) ?? 'Ohne Titel'

  return {
    id,
    title,
    description:
      readString(raw.description_de) ?? readString(raw.description_en) ?? '',
    location: readString(raw.location) ?? '',
    startDateTime,
    endDateTime: readString(raw.end_date_time),
    eventUrl: readString(raw.event_url),
    isInternal: raw.is_internal === true,
  }
}
