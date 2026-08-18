import { createFileRoute } from '@tanstack/react-router'
import { serverConfig } from '#/lib/config'
import { registerDiscordRoleConnectionMetadata } from '#/lib/integrations/discord/linked-roles'

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

export const Route = createFileRoute(
  '/api/internal/discord-linked-roles/register',
)({
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

        if (!serverConfig.discord.isLinkedRolesConfigured) {
          return new Response(
            JSON.stringify({
              error:
                'Discord Linked Roles are not configured (need DISCORD_CLIENT_ID/SECRET + DISCORD_BOT_TOKEN)',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        await registerDiscordRoleConnectionMetadata()

        return new Response(
          JSON.stringify({
            ok: true,
            verificationUrl: serverConfig.discord.linkedRoleVerificationUrl,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
