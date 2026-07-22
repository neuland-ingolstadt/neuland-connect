import { createServerFn } from '@tanstack/react-start'
import { isGitHubConnected, parseUserAttributes } from '#/lib/authentik/types'

export type CurrentUser = {
  sub: string
  email: string
  name: string
  username: string
  attributes: ReturnType<typeof parseUserAttributes>
  githubConnected: boolean
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { getAuthentikUser } = await import('#/lib/authentik/client')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )

    const sessionData = await requireSessionUser()
    if (!sessionData) {
      return null
    }

    const { user, session } = sessionData
    const authentikUserId = await resolveSessionAuthentikUserId(user)

    if (!user.authentikUserId) {
      await session.update({
        ...session.data,
        user: {
          ...user,
          authentikUserId,
        },
      })
    }

    const authentikUser = await getAuthentikUser(authentikUserId)
    const attributes = parseUserAttributes(authentikUser.attributes)

    return {
      sub: user.sub,
      email: user.email || authentikUser.email,
      name: user.name || authentikUser.name,
      username: authentikUser.username,
      attributes,
      githubConnected: isGitHubConnected(attributes),
    }
  },
)
