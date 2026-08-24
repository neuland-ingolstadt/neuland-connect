import {
  type CampusLifeEvent,
  type CampusLifeEventsResult,
  mapCampusLifeApiEvent,
} from '#/lib/campus-life/types'

function sortByStart(a: CampusLifeEvent, b: CampusLifeEvent): number {
  return a.startDateTime.localeCompare(b.startDateTime) || a.id - b.id
}

function extractEventItems(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    Array.isArray((payload as { items: unknown }).items)
  ) {
    return (payload as { items: unknown[] }).items
  }

  return null
}

export async function fetchNeulandEvents(): Promise<CampusLifeEventsResult> {
  const { serverConfig } = await import('#/lib/config')

  if (!serverConfig.campusLife.isConfigured) {
    return {
      events: [],
      error: 'not_configured',
    }
  }

  // Bearer-token my-events API: all events for the token holder's club,
  // including host-only and unpublished-in-iCal events.
  const url = new URL(`${serverConfig.campusLife.apiUrl}/v1/my-events`)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverConfig.campusLife.apiKey}`,
      },
    })

    if (!response.ok) {
      console.error(
        `[campus-life] Events request failed: ${response.status} ${response.statusText}`,
      )
      return {
        events: [],
        error: 'fetch_failed',
      }
    }

    const payload: unknown = await response.json()
    const items = extractEventItems(payload)
    if (!items) {
      console.error('[campus-life] Events response was not a list')
      return {
        events: [],
        error: 'invalid_response',
      }
    }

    const events = items
      .map(item => {
        if (!item || typeof item !== 'object') {
          return null
        }

        return mapCampusLifeApiEvent(item)
      })
      .filter((event): event is CampusLifeEvent => event !== null)
      .sort(sortByStart)

    return {
      events,
      error: null,
    }
  } catch (error) {
    console.error('[campus-life] Events request threw', error)
    return {
      events: [],
      error: 'fetch_failed',
    }
  }
}
