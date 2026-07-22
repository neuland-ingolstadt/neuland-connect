import { createFileRoute } from '@tanstack/react-router'
import { initiateOidcLogin } from '#/lib/auth/oidc'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: async () => initiateOidcLogin(),
    },
  },
})
