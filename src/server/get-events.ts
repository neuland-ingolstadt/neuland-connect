import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { fetchNeulandEvents } from '#/lib/campus-life/client'
import type { CampusLifeEventsResult } from '#/lib/campus-life/types'
import { ROUTES } from '#/lib/constants'

export const getNeulandEventsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CampusLifeEventsResult> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const sessionData = await requireSessionUser()

    if (!sessionData) {
      throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
    }

    return fetchNeulandEvents()
  },
)
