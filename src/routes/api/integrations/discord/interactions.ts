import { createFileRoute } from '@tanstack/react-router'
import { handleDiscordInteractionsRequest } from '#/lib/integrations/discord/interactions'

export const Route = createFileRoute('/api/integrations/discord/interactions')({
  server: {
    handlers: {
      POST: async ({ request }) => handleDiscordInteractionsRequest(request),
    },
  },
})
