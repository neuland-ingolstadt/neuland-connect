import { ROUTES } from '#/lib/constants'
import {
  startDiscordBot,
  stopDiscordBot,
} from '#/lib/integrations/discord/bot-lifecycle.server'
import { handleDiscordInteractionsRequest } from '#/lib/integrations/discord/interactions'

void startDiscordBot()

void import('#/lib/authentik/client').then(({ getManagedIntegrationMaps }) => {
  void getManagedIntegrationMaps().catch(() => {})
})

if (typeof process !== 'undefined') {
  const shutdown = () => {
    stopDiscordBot()
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

export default {
  async fetch(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url)

    if (
      request.method === 'POST' &&
      url.pathname === ROUTES.DISCORD_INTERACTIONS
    ) {
      return handleDiscordInteractionsRequest(request)
    }

    return undefined
  },
}
