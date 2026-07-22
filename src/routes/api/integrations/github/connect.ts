import { createFileRoute } from '@tanstack/react-router'
import { initiateGitHubConnect } from '#/lib/integrations/github/oauth'

export const Route = createFileRoute('/api/integrations/github/connect')({
  server: {
    handlers: {
      GET: async () => initiateGitHubConnect(),
    },
  },
})
