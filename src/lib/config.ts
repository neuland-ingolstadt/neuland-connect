import { APP_NAME, NEULAND_NEXT_APP_SLUG } from '#/lib/constants'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export const serverConfig = {
  get appUrl() {
    return requireEnv('APP_URL').replace(/\/$/, '')
  },
  get sessionSecret() {
    return requireEnv('SESSION_SECRET')
  },
  authentik: {
    get issuer() {
      return requireEnv('AUTHENTIK_ISSUER').replace(/\/$/, '')
    },
    get clientId() {
      return requireEnv('AUTHENTIK_CLIENT_ID')
    },
    get clientSecret() {
      return requireEnv('AUTHENTIK_CLIENT_SECRET')
    },
    get apiUrl() {
      // Paths in authentik/client.ts already include /api/v3/...
      return requireEnv('AUTHENTIK_API_URL')
        .replace(/\/$/, '')
        .replace(/\/api\/v3$/, '')
    },
    get apiToken() {
      return requireEnv('AUTHENTIK_API_TOKEN')
    },
    /**
     * OAuth2 provider PK for Neuland Next (Member ID). Optional - Connect
     * resolves it from the Authentik app slug when unset.
     */
    get nextMemberOAuthProviderId() {
      const raw = optionalEnv('AUTHENTIK_NEXT_OAUTH_PROVIDER_ID')
      if (!raw) {
        return undefined
      }

      const parsed = Number(raw)
      return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
    },
    get nextMemberAppSlug() {
      return optionalEnv('AUTHENTIK_NEXT_APP_SLUG') ?? NEULAND_NEXT_APP_SLUG
    },
  },
  github: {
    get clientId() {
      return requireEnv('GITHUB_CLIENT_ID')
    },
    get clientSecret() {
      return requireEnv('GITHUB_CLIENT_SECRET')
    },
    get redirectUri() {
      return `${serverConfig.appUrl}/api/integrations/github/callback`
    },
    get appId() {
      return optionalEnv('GITHUB_APP_ID')
    },
    get appPrivateKey() {
      const key = optionalEnv('GITHUB_APP_PRIVATE_KEY')
      if (!key) {
        return undefined
      }
      return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key
    },
    get appInstallationId() {
      return optionalEnv('GITHUB_APP_INSTALLATION_ID')
    },
    get org() {
      return optionalEnv('GITHUB_ORG')
    },
    get isOrgSyncConfigured() {
      return Boolean(
        serverConfig.github.appId &&
          serverConfig.github.appPrivateKey &&
          serverConfig.github.appInstallationId &&
          serverConfig.github.org,
      )
    },
    /** Team sync needs the same GitHub App as org sync; managed teams = groups with `github_team`. */
    get isTeamSyncConfigured() {
      return serverConfig.github.isOrgSyncConfigured
    },
  },
  discord: {
    get clientId() {
      return requireEnv('DISCORD_CLIENT_ID')
    },
    get clientSecret() {
      return requireEnv('DISCORD_CLIENT_SECRET')
    },
    get redirectUri() {
      return `${serverConfig.appUrl}/api/integrations/discord/callback`
    },
    get botToken() {
      return requireEnv('DISCORD_BOT_TOKEN')
    },
    get guildId() {
      return requireEnv('DISCORD_GUILD_ID')
    },
    get publicKey() {
      return requireEnv('DISCORD_PUBLIC_KEY')
        .trim()
        .replace(/^['"]|['"]$/g, '')
    },
  },
  get cronSecret() {
    return optionalEnv('CRON_SECRET')
  },
  campusLife: {
    get apiUrl() {
      return (
        optionalEnv('CL_API_URL') ?? 'https://cl.neuland-ingolstadt.de/api'
      ).replace(/\/$/, '')
    },
    get apiKey() {
      return optionalEnv('CL_API_KEY')
    },
    get isConfigured() {
      return Boolean(serverConfig.campusLife.apiKey)
    },
  },
} as const

export const clientConfig = {
  appName: APP_NAME,
} as const
