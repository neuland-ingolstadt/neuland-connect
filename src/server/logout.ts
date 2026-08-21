import { createServerFn } from '@tanstack/react-start'
import { completeOidcLogout } from '#/lib/auth/oidc'

/** CSRF-protected logout (createCsrfMiddleware covers serverFns). */
export const logoutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ redirectTo: string }> => {
    return completeOidcLogout()
  },
)
