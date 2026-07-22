import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTES } from '#/lib/constants'
import { getCurrentUserFn } from '#/server/get-current-user'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()

    if (user) {
      throw redirect({
        to: ROUTES.DASHBOARD,
        search: {
          integration: undefined,
          status: undefined,
          message: undefined,
        },
      })
    }

    throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
  },
})
