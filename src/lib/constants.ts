export const APP_NAME = 'Neuland Connect' as const

export const EXTERNAL_LINKS = {
  WEBSITE: 'https://neuland-ingolstadt.de',
  /** Main website legal pages — Connect uses ROUTES.IMPRESSUM / ROUTES.DATENSCHUTZ */
  WEBSITE_IMPRESSUM: 'https://neuland-ingolstadt.de/legal/impressum',
  /** Main website policy - Connect uses ROUTES.DATENSCHUTZ instead */
  WEBSITE_DATENSCHUTZ: 'https://neuland-ingolstadt.de/legal/datenschutz',
  REPOSITORY: 'https://github.com/neuland-ingolstadt/neuland-connect',
  EGGL_DEV: 'https://eggl.dev',
  NEULAND_NEXT_GET: 'https://neuland.app/get',
} as const

/** Authentik application slug for the Next Mitgliedsausweis OIDC client */
export const NEULAND_NEXT_APP_SLUG = 'next' as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CONNECT: '/connect',
  RESSOURCEN: '/ressourcen',
  FAQ: '/faq',
  IMPRESSUM: '/impressum',
  DATENSCHUTZ: '/datenschutz',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_CALLBACK: '/api/auth/callback',
  AUTH_LOGOUT: '/api/auth/logout',
  GITHUB_CONNECT: '/api/integrations/github/connect',
  GITHUB_CALLBACK: '/api/integrations/github/callback',
  DISCORD_CONNECT: '/api/integrations/discord/connect',
  DISCORD_CALLBACK: '/api/integrations/discord/callback',
  DISCORD_INTERACTIONS: '/api/integrations/discord/interactions',
} as const

export const AUTHENTIK_ATTRIBUTES = {
  GITHUB_USERNAME: 'github_username',
  GITHUB_ID: 'github_id',
  GITHUB_CONNECTED_AT: 'github_connected_at',
  GITHUB_ORG_STATUS: 'github_org_status',
  GITHUB_ORG_INVITED_AT: 'github_org_invited_at',
  GITHUB_ORG_LAST_ERROR: 'github_org_last_error',
  /** Authentik *group* attribute: GitHub team slug for team sync */
  GITHUB_TEAM: 'github_team',
  DISCORD_USERNAME: 'discord_username',
  DISCORD_ID: 'discord_id',
  DISCORD_CONNECTED_AT: 'discord_connected_at',
  DISCORD_GUILD_STATUS: 'discord_guild_status',
  DISCORD_GUILD_JOINED_AT: 'discord_guild_joined_at',
  DISCORD_GUILD_LAST_ERROR: 'discord_guild_last_error',
  /** Authentik *group* attribute: Discord role snowflake for role sync */
  DISCORD_ROLE: 'discord_role',
} as const

export const GITHUB_ORG_STATUSES = {
  INVITED: 'invited',
  MEMBER: 'member',
  ADMIN: 'admin',
} as const

export type GitHubOrgStatus =
  (typeof GITHUB_ORG_STATUSES)[keyof typeof GITHUB_ORG_STATUSES]

export const GITHUB_OAUTH_SCOPE = 'read:user' as const

export const DISCORD_GUILD_STATUSES = {
  MEMBER: 'member',
} as const

export type DiscordGuildStatus =
  (typeof DISCORD_GUILD_STATUSES)[keyof typeof DISCORD_GUILD_STATUSES]

export const DISCORD_OAUTH_SCOPE = 'identify guilds.join' as const

export const SESSION_COOKIE_NAME = 'neuland-connect-session' as const

export const LOGIN_SEARCH_DEFAULTS = {
  error: undefined,
  start: undefined,
} as const

/** Query flag so /login shows the loading box and starts Authentik */
export const LOGIN_START_SEARCH = '1' as const

export const CONNECT_SEARCH_DEFAULTS = {
  integration: undefined,
  status: undefined,
  message: undefined,
} as const

export function isLoginStartFlag(value: unknown): boolean {
  return (
    value === LOGIN_START_SEARCH ||
    value === true ||
    value === 1 ||
    value === '1'
  )
}

export function connectStatusPath(options: {
  integration: 'github' | 'discord'
  status: 'success' | 'error' | 'disconnected'
  message?: string
}): string {
  const params = new URLSearchParams({
    integration: options.integration,
    status: options.status,
  })

  if (options.message) {
    params.set('message', options.message)
  }

  return `${ROUTES.CONNECT}?${params.toString()}`
}

/** Campus Life organizer id for Neuland Ingolstadt e.V. */
export const NEULAND_CAMPUS_LIFE_ORGANIZER_ID = 4 as const
