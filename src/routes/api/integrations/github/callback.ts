import { createFileRoute } from '@tanstack/react-router'
import { handleGitHubCallback } from '#/lib/integrations/github/oauth'

export const Route = createFileRoute('/api/integrations/github/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => handleGitHubCallback(request),
    },
  },
})
