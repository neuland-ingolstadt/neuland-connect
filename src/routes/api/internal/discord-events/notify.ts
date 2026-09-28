import { createFileRoute } from '@tanstack/react-router'
import { serverConfig } from '#/lib/config'
import { notifyTodaysEvents } from '#/lib/integrations/discord/events-notify'
import { createLogger } from '#/lib/logger.server'

const log = createLogger('discord-events')

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim() || null
}

export const Route = createFileRoute('/api/internal/discord-events/notify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = serverConfig.cronSecret
        if (!cronSecret) {
          return new Response(
            JSON.stringify({ error: 'CRON_SECRET is not configured' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        const token = extractBearerToken(request)
        if (!token || token !== cronSecret) {
          return unauthorizedResponse()
        }

        void notifyTodaysEvents()
          .then(result => {
            log.info({ result }, 'Notify completed')
          })
          .catch(error => {
            log.error({ err: error }, 'Notify failed')
          })

        return new Response(JSON.stringify({ ok: true, status: 'started' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
