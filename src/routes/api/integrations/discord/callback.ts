import { createFileRoute } from '@tanstack/react-router'
import { handleDiscordCallback } from '#/lib/integrations/discord/oauth'

export const Route = createFileRoute('/api/integrations/discord/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => handleDiscordCallback(request),
    },
  },
})
