import {
  startDiscordBot,
  stopDiscordBot,
} from '#/lib/integrations/discord/bot-lifecycle.server'

void startDiscordBot()

if (typeof process !== 'undefined') {
  const shutdown = () => {
    stopDiscordBot()
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

export default {}
