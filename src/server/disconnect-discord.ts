import { createServerFn } from '@tanstack/react-start'
import { disconnectDiscordConnection } from '#/lib/integrations/discord/disconnect'

export const disconnectDiscordFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    await disconnectDiscordConnection()
    return { success: true }
  },
)
