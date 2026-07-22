import { createServerFn } from '@tanstack/react-start'
import { isGitHubConnected, parseUserAttributes } from '#/lib/authentik/types'

export type CurrentUser = {
  sub: string
  email: string
  name: string
  username: string
  groups: string[]
  attributes: ReturnType<typeof parseUserAttributes>
  githubConnected: boolean
  githubOrg: string | null
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { serverConfig } = await import('#/lib/config')
    const { getAuthentikUser, getAuthentikUserGroups } = await import(
      '#/lib/authentik/client'
    )
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

    const [authentikUser, groups] = await Promise.all([
      getAuthentikUser(authentikUserId),
      getAuthentikUserGroups(authentikUserId).catch(() => [] as string[]),
    ])
    const attributes = parseUserAttributes(authentikUser.attributes)

    return {
      sub: user.sub,
      email: user.email || authentikUser.email,
      name: user.name || authentikUser.name,
      username: authentikUser.username,
      groups,
      attributes,
      githubConnected: isGitHubConnected(attributes),
      githubOrg: serverConfig.github.org ?? null,
    }
  },
)
