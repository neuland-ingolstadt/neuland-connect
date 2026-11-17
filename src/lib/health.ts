/**
 * Config readiness for `/api/health`.
 * Checks env presence only — no outbound calls, no secrets in the response.
 */

export type HealthCheckId =
  | 'appUrl'
  | 'session'
  | 'authentik'
  | 'githubOAuth'
  | 'discord'
  | 'githubOrgSync'
  | 'campusLife'
  | 'cronSecret'
  | 'discordEvents'

export type HealthCheck = {
  id: HealthCheckId
  /** When true, a failing check makes the overall status `unready` (HTTP 503). */
  required: boolean
  ok: boolean
}

export type HealthReport = {
  status: 'ok' | 'degraded' | 'unready'
  checks: HealthCheck[]
}

type EnvMap = Record<string, string | undefined>

function envPresent(env: EnvMap, name: string): boolean {
  const value = env[name]
  return Boolean(value && value.trim().length > 0)
}

function allPresent(env: EnvMap, names: string[]): boolean {
  return names.every(name => envPresent(env, name))
}

/**
 * Snapshot of integration / core config readiness.
 * Safe to expose publicly (booleans only).
 */
export function getHealthReport(env: EnvMap = process.env): HealthReport {
  const checks: HealthCheck[] = [
    {
      id: 'appUrl',
      required: true,
      ok: envPresent(env, 'APP_URL'),
    },
    {
      id: 'session',
      required: true,
      ok: envPresent(env, 'SESSION_SECRET'),
    },
    {
      id: 'authentik',
      required: true,
      ok: allPresent(env, [
        'AUTHENTIK_ISSUER',
        'AUTHENTIK_CLIENT_ID',
        'AUTHENTIK_CLIENT_SECRET',
        'AUTHENTIK_API_URL',
        'AUTHENTIK_API_TOKEN',
      ]),
    },
    {
      id: 'githubOAuth',
      required: true,
      ok: allPresent(env, ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']),
    },
    {
      id: 'discord',
      required: true,
      ok: allPresent(env, [
        'DISCORD_CLIENT_ID',
        'DISCORD_CLIENT_SECRET',
        'DISCORD_BOT_TOKEN',
        'DISCORD_GUILD_ID',
      ]),
    },
    {
      id: 'githubOrgSync',
      required: false,
      ok: allPresent(env, [
        'GITHUB_APP_ID',
        'GITHUB_APP_PRIVATE_KEY',
        'GITHUB_APP_INSTALLATION_ID',
        'GITHUB_ORG',
      ]),
    },
    {
      id: 'campusLife',
      required: false,
      ok: envPresent(env, 'CL_API_KEY'),
    },
    {
      id: 'cronSecret',
      required: false,
      ok: envPresent(env, 'CRON_SECRET'),
    },
    {
      id: 'discordEvents',
      required: false,
      ok: envPresent(env, 'DISCORD_EVENTS_CHANNEL_ID'),
    },
  ]

  const requiredFailed = checks.some(check => check.required && !check.ok)
  const optionalFailed = checks.some(check => !check.required && !check.ok)

  let status: HealthReport['status'] = 'ok'
  if (requiredFailed) {
    status = 'unready'
  } else if (optionalFailed) {
    status = 'degraded'
  }

  return { status, checks }
}

export function healthHttpStatus(report: HealthReport): 200 | 503 {
  return report.status === 'unready' ? 503 : 200
}
