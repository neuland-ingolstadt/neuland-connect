import { useSession } from '@tanstack/react-start/server'
import { serverConfig } from '#/lib/config'
import { SESSION_COOKIE_NAME } from '#/lib/constants'
import type { SessionData } from '#/lib/session-types'

export type { SessionUser } from '#/lib/session-types'

export function useAppSession() {
  return useSession<SessionData>({
    name: SESSION_COOKIE_NAME,
    password: serverConfig.sessionSecret,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    },
  })
}

export async function requireSessionUser() {
  const session = await useAppSession()
  const user = session.data.user

  if (!user) {
    return null
  }

  return { session, user }
}
