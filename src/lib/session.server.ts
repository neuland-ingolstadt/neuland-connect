import {
  deleteCookie,
  getCookie,
  getRequest,
  setCookie,
} from '@tanstack/react-start/server'
import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from 'iron-session'
import { serverConfig } from '#/lib/config'
import { SESSION_COOKIE_NAME } from '#/lib/constants'
import { createLogger } from '#/lib/logger.server'
import type { SessionData } from '#/lib/session-types'

const log = createLogger('session')

/**
 * Cookie written by Start's removed `useSession` (h3 seal). iron-session cannot
 * read it, so the next request expires it and the member signs in again.
 */
const LEGACY_SESSION_COOKIE_NAME = 'neuland-connect-session'

/** Sliding lifetime. iron-session also sets the cookie max-age from this. */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const SESSION_KEYS = [
  'user',
  'oidc',
  'oidcState',
  'oidcCodeVerifier',
  'githubOAuthState',
  'discordOAuthState',
] as const satisfies ReadonlyArray<keyof SessionData>

export type AppSession = {
  readonly data: SessionData
  update: (data: SessionData) => Promise<void>
  clear: () => Promise<void>
}

const ironSessionByRequest = new WeakMap<
  Request,
  Promise<IronSession<SessionData>>
>()
const legacyCookieCleared = new WeakSet<Request>()

function sessionOptions(): SessionOptions {
  const password = serverConfig.sessionSecret
  if (password.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters')
  }

  return {
    cookieName: SESSION_COOKIE_NAME,
    password,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    },
    onUnsealError(reason, error) {
      if (reason === 'expired') {
        return
      }
      log.warn({ reason, err: error }, 'Session cookie rejected')
    },
  }
}

function clearLegacySessionCookie(request: Request) {
  if (legacyCookieCleared.has(request)) {
    return
  }
  legacyCookieCleared.add(request)

  if (!getCookie(LEGACY_SESSION_COOKIE_NAME)) {
    return
  }

  deleteCookie(LEGACY_SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

function readSessionData(session: IronSession<SessionData>): SessionData {
  return {
    user: session.user,
    oidc: session.oidc,
    oidcState: session.oidcState,
    oidcCodeVerifier: session.oidcCodeVerifier,
    githubOAuthState: session.githubOAuthState,
    discordOAuthState: session.discordOAuthState,
  }
}

function applySessionData(
  session: IronSession<SessionData>,
  data: SessionData,
) {
  for (const key of SESSION_KEYS) {
    if (data[key] === undefined) {
      delete session[key]
      continue
    }

    Object.assign(session, { [key]: data[key] })
  }
}

function getIronAppSession(request: Request) {
  const existing = ironSessionByRequest.get(request)
  if (existing) {
    return existing
  }

  const pending = getIronSession<SessionData>(
    {
      read: name => getCookie(name),
      write: (name, value, options) => {
        setCookie(name, value, options)
      },
    },
    sessionOptions(),
  )
  ironSessionByRequest.set(request, pending)
  return pending
}

/**
 * Request-scoped encrypted cookie session.
 *
 * A second call in the same request returns the same iron-session object.
 * `getIronSession` itself would read the incoming cookie again and drop
 * unsaved edits. Call `update` or `clear` before returning or redirecting.
 */
export async function useAppSession(): Promise<AppSession> {
  const request = getRequest()
  clearLegacySessionCookie(request)
  const iron = await getIronAppSession(request)

  return {
    get data() {
      return readSessionData(iron)
    },
    async update(data) {
      applySessionData(iron, data)
      await iron.save()
    },
    async clear() {
      iron.destroy()
    },
  }
}

export async function requireSessionUser() {
  const session = await useAppSession()
  const user = session.data.user

  if (!user) {
    return null
  }

  return { session, user }
}
