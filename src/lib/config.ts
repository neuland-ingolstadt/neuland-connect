import { APP_NAME } from '#/lib/constants'

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
  get cronSecret() {
    return optionalEnv('CRON_SECRET')
  },
} as const

export const clientConfig = {
  appName: APP_NAME,
} as const
