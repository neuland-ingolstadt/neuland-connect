import { createFileRoute } from '@tanstack/react-router'
import { initiateOidcLogout } from '#/lib/auth/oidc'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      // Prefer logoutFn (CSRF) from the UI. POST keeps SameSite=lax from
      // sending cookies on cross-site form posts; GET is rejected to block
      // logout CSRF via <img>/<a> top-level navigations.
      POST: async () => initiateOidcLogout(),
      GET: async () =>
        new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        }),
    },
  },
})
