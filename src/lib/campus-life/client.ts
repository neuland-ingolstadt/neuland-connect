import {
  type CampusLifeEvent,
  type CampusLifeEventsResult,
  mapCampusLifeApiEvent,
} from '#/lib/campus-life/types'
import { NEULAND_CAMPUS_LIFE_ORGANIZER_ID } from '#/lib/constants'

function sortByStart(a: CampusLifeEvent, b: CampusLifeEvent): number {
  return a.startDateTime.localeCompare(b.startDateTime) || a.id - b.id
}

export async function fetchNeulandEvents(): Promise<CampusLifeEventsResult> {
  const { serverConfig } = await import('#/lib/config')

  if (!serverConfig.campusLife.isConfigured) {
    return {
      events: [],
      error: 'not_configured',
    }
  }

  const url = `${serverConfig.campusLife.apiUrl}/ical/${NEULAND_CAMPUS_LIFE_ORGANIZER_ID}/events`

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
    if (!Array.isArray(payload)) {
      console.error('[campus-life] Events response was not an array')
      return {
        events: [],
        error: 'invalid_response',
      }
    }

    const events = payload
      .map(item =>
        item && typeof item === 'object' ? mapCampusLifeApiEvent(item) : null,
      )
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
