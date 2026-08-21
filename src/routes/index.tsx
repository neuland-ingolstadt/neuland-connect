import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTES } from '#/lib/constants'
import { hasActiveSessionFn } from '#/server/get-current-user'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const hasSession = await hasActiveSessionFn()

    if (hasSession) {
      throw redirect({
        to: ROUTES.DASHBOARD,
        search: {
          integration: undefined,
          status: undefined,
          message: undefined,
          intro: undefined,
        },
      })
    }

    throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
  },
})
