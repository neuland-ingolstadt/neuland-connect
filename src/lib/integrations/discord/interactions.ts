import { serverConfig } from '#/lib/config'
import { ROUTES } from '#/lib/constants'
import { verifyDiscordInteractionRequest } from '#/lib/integrations/discord/verify-interaction'

const DISCORD_INTERACTION_TYPES = {
  PING: 1,
  APPLICATION_COMMAND: 2,
} as const

const DISCORD_INTERACTION_RESPONSE_TYPES = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
} as const

const DISCORD_MESSAGE_FLAGS = {
  EPHEMERAL: 1 << 6,
} as const

const DISCORD_COMPONENT_TYPES = {
  ACTION_ROW: 1,
  BUTTON: 2,
} as const

const DISCORD_BUTTON_STYLES = {
  LINK: 5,
} as const

type DiscordInteraction = {
  type: number
  data?: {
    name?: string
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function connectDashboardUrl(): string {
  return `${serverConfig.appUrl}${ROUTES.DASHBOARD}`
}

function buildConnectCommandResponse(): Response {
  return jsonResponse({
    type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content:
        'GitHub und Discord verbindest du über Neuland Connect. Melde dich dort mit deinem Vereinskonto an.',
      flags: DISCORD_MESSAGE_FLAGS.EPHEMERAL,
      components: [
        {
          type: DISCORD_COMPONENT_TYPES.ACTION_ROW,
          components: [
            {
              type: DISCORD_COMPONENT_TYPES.BUTTON,
              style: DISCORD_BUTTON_STYLES.LINK,
              label: 'Connect öffnen',
              url: connectDashboardUrl(),
            },
          ],
        },
      ],
    },
  })
}

export function handleDiscordInteraction(
  interaction: DiscordInteraction,
): Response {
  if (interaction.type === DISCORD_INTERACTION_TYPES.PING) {
    return jsonResponse({ type: DISCORD_INTERACTION_RESPONSE_TYPES.PONG })
  }

  if (interaction.type === DISCORD_INTERACTION_TYPES.APPLICATION_COMMAND) {
    if (interaction.data?.name === 'connect') {
      return buildConnectCommandResponse()
    }

    return jsonResponse({
      type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Unbekannter Befehl.',
        flags: DISCORD_MESSAGE_FLAGS.EPHEMERAL,
      },
    })
  }

  return new Response('Bad Request', { status: 400 })
}

function notConfiguredResponse(): Response {
  return jsonResponse({ error: 'Not configured' }, 503)
}

function unauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401 })
}

export async function handleDiscordInteractionsRequest(
  request: Request,
): Promise<Response> {
  if (!serverConfig.discord.isInteractionsConfigured) {
    console.warn(
      '[discord-interactions] Rejected request: interactions not configured',
    )
    return notConfiguredResponse()
  }

  const signature = request.headers.get('X-Signature-Ed25519')
  const timestamp = request.headers.get('X-Signature-Timestamp')
  const rawBody = await request.text()
  const publicKey = serverConfig.discord.publicKey

  if (
    !publicKey ||
    !verifyDiscordInteractionRequest(rawBody, signature, timestamp, publicKey)
  ) {
    console.warn('[discord-interactions] Rejected request: invalid signature')
    return unauthorizedResponse()
  }

  let interaction: DiscordInteraction

  try {
    interaction = JSON.parse(rawBody) as DiscordInteraction
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  return handleDiscordInteraction(interaction)
}
