import { createServerFn } from '@tanstack/react-start'
import { isDiscordConnected, parseUserAttributes } from '#/lib/authentik/types'

export type SyncDiscordRolesFnResult = {
  status: 'synced' | 'skipped' | 'error'
  desired: string[]
  added: string[]
  removed: string[]
  error?: string
}

export const syncDiscordRolesFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<SyncDiscordRolesFnResult> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const { getAuthentikUser } = await import('#/lib/authentik/client')
    const { resolveSessionAuthentikUserId } = await import(
      '#/lib/authentik/session-user'
    )
    const { syncUserDiscordRoles } = await import(
      '#/lib/integrations/discord/roles-sync'
    )

    const sessionData = await requireSessionUser()
    if (!sessionData) {
      throw new Error('Nicht angemeldet.')
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

    if (!isDiscordConnected(attributes) || !attributes.discordId) {
      throw new Error('Discord ist nicht verbunden.')
    }

    const result = await syncUserDiscordRoles(
      authentikUserId,
      attributes.discordId,
    )

    if (result.status === 'skipped') {
      throw new Error(
        'Du bist noch nicht im Discord-Server. Verbinde Discord erneut, um dem Server beizutreten.',
      )
    }

    if (result.status === 'error') {
      throw new Error(result.error ?? 'Discord-Rollen-Sync fehlgeschlagen.')
    }

    return {
      status: result.status,
      desired: result.desired,
      added: result.added,
      removed: result.removed,
    }
  },
)
