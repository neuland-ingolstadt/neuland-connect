import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { LOGIN_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { type CurrentUser, getCurrentUserFn } from '#/server/get-current-user'

/** Mirror server user-cache TTL so soft navigations skip the boot flash. */
const CLIENT_USER_FRESH_MS = 15_000

let clientUserCache: { user: CurrentUser; fetchedAt: number } | null = null

export function clearClientSignedInUserCache(): void {
  clientUserCache = null
}

export function setClientSignedInUserCache(user: CurrentUser): void {
  clientUserCache = { user, fetchedAt: Date.now() }
}

function readFreshClientUser(): CurrentUser | null {
  if (!clientUserCache) {
    return null
  }

  if (Date.now() - clientUserCache.fetchedAt >= CLIENT_USER_FRESH_MS) {
    return null
  }

  return clientUserCache.user
}

export type SignedInUserState = {
  user: CurrentUser | null
  error: boolean
  retry: () => void
}

/**
 * Cookie gate belongs in the route loader. Authentik profile loads here so
 * the first HTML paint is never blocked on Authentik (ConnectBootScreen).
 */
export function useSignedInUser(): SignedInUserState {
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(readFreshClientUser)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    clearClientSignedInUserCache()
    setError(false)
    setUser(null)
    setAttempt(value => value + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    void attempt

    const cached = readFreshClientUser()
    if (cached) {
      setUser(cached)
      setError(false)
      return
    }

    void (async () => {
      try {
        const next = await getCurrentUserFn()
        if (cancelled) {
          return
        }

        if (!next) {
          clientUserCache = null
          await navigate({ to: ROUTES.LOGIN, search: LOGIN_SEARCH_DEFAULTS })
          return
        }

        clientUserCache = { user: next, fetchedAt: Date.now() }
        setError(false)
        setUser(next)
      } catch {
        if (cancelled) {
          return
        }

        setError(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attempt, navigate])

  return { user, error, retry }
}
