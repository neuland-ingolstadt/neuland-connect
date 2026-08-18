import { createFileRoute } from '@tanstack/react-router'
import { serverConfig } from '#/lib/config'
import { handleDiscordInteraction } from '#/lib/integrations/discord/interactions'
import { verifyDiscordInteractionRequest } from '#/lib/integrations/discord/verify-interaction'

function notConfiguredResponse(): Response {
  return new Response(JSON.stringify({ error: 'Not configured' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  })
}

function unauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401 })
}

export const Route = createFileRoute('/api/integrations/discord/interactions')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!serverConfig.discord.isInteractionsConfigured) {
          return notConfiguredResponse()
        }

        const signature = request.headers.get('X-Signature-Ed25519')
        const timestamp = request.headers.get('X-Signature-Timestamp')
        const rawBody = await request.text()
        const publicKey = serverConfig.discord.publicKey

        if (
          !publicKey ||
          !verifyDiscordInteractionRequest(
            rawBody,
            signature,
            timestamp,
            publicKey,
          )
        ) {
          return unauthorizedResponse()
        }

        let interaction: Parameters<typeof handleDiscordInteraction>[0]

        try {
          interaction = JSON.parse(rawBody) as Parameters<
            typeof handleDiscordInteraction
          >[0]
        } catch {
          return new Response('Bad Request', { status: 400 })
        }

        return handleDiscordInteraction(interaction)
      },
    },
  },
})
