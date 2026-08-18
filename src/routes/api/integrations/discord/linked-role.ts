import { createFileRoute } from '@tanstack/react-router'
import { initiateDiscordLinkedRole } from '#/lib/integrations/discord/oauth'

export const Route = createFileRoute('/api/integrations/discord/linked-role')({
  server: {
    handlers: {
      GET: async () => initiateDiscordLinkedRole(),
    },
  },
})
