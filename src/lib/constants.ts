export const APP_NAME = 'Neuland Connect' as const

export const EXTERNAL_LINKS = {
  WEBSITE: 'https://neuland-ingolstadt.de',
  IMPRESSUM: 'https://neuland-ingolstadt.de/legal/impressum',
  DATENSCHUTZ: 'https://neuland-ingolstadt.de/legal/datenschutz',
  REPOSITORY: 'https://github.com/neuland-ingolstadt/neuland-connect',
  NEULAND_NEXT_GET: 'https://neuland.app/get',
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_CALLBACK: '/api/auth/callback',
  AUTH_LOGOUT: '/api/auth/logout',
  GITHUB_CONNECT: '/api/integrations/github/connect',
  GITHUB_CALLBACK: '/api/integrations/github/callback',
} as const

export const AUTHENTIK_ATTRIBUTES = {
  GITHUB_USERNAME: 'github_username',
  GITHUB_ID: 'github_id',
  GITHUB_CONNECTED_AT: 'github_connected_at',
  GITHUB_ORG_STATUS: 'github_org_status',
  GITHUB_ORG_INVITED_AT: 'github_org_invited_at',
  GITHUB_ORG_LAST_ERROR: 'github_org_last_error',
} as const

export const GITHUB_ORG_STATUSES = {
  INVITED: 'invited',
  MEMBER: 'member',
  ADMIN: 'admin',
} as const

export type GitHubOrgStatus =
  (typeof GITHUB_ORG_STATUSES)[keyof typeof GITHUB_ORG_STATUSES]

export const GITHUB_OAUTH_SCOPE = 'read:user' as const

export const SESSION_COOKIE_NAME = 'neuland-connect-session' as const

export const QUERY_KEYS = {
  CURRENT_USER: ['current-user'] as const,
} as const
