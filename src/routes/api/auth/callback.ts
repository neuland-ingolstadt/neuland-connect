import { createFileRoute } from '@tanstack/react-router'
import { handleOidcCallback } from '#/lib/auth/oidc'

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => handleOidcCallback(request),
    },
  },
})
