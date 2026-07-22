import {
  getAuthentikApiUserId,
  resolveAuthentikUser,
} from '#/lib/authentik/client'
import type { SessionUser } from '#/lib/session-types'

export async function resolveSessionAuthentikUserId(
  user: SessionUser,
): Promise<string> {
  if (user.authentikUserId) {
    return user.authentikUserId
  }

  const authentikUser = await resolveAuthentikUser({
    sub: user.sub,
    email: user.email || undefined,
    username: user.username,
  })

  return getAuthentikApiUserId(authentikUser)
}
