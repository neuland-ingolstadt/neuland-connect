import { createFileRoute } from '@tanstack/react-router'
import { initiateDiscordConnect } from '#/lib/integrations/discord/oauth'

export const Route = createFileRoute('/api/integrations/discord/connect')({
  server: {
    handlers: {
      GET: async () => initiateDiscordConnect(),
    },
  },
})
