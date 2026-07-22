import { createFileRoute } from '@tanstack/react-router'
import { initiateOidcLogout } from '#/lib/auth/oidc'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      GET: async () => initiateOidcLogout(),
    },
  },
})
