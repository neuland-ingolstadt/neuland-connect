import { describe, expect, test } from 'bun:test'
import { getHealthReport, healthHttpStatus } from '#/lib/health'

const REQUIRED_ENV = {
  APP_URL: 'https://connect.example',
  SESSION_SECRET: 'x'.repeat(32),
  AUTHENTIK_ISSUER: 'https://auth.example/application/o/neuland-connect/',
  AUTHENTIK_CLIENT_ID: 'client',
  AUTHENTIK_CLIENT_SECRET: 'secret',
  AUTHENTIK_API_URL: 'https://auth.example',
  AUTHENTIK_API_TOKEN: 'token',
  GITHUB_CLIENT_ID: 'gh-client',
  GITHUB_CLIENT_SECRET: 'gh-secret',
  DISCORD_CLIENT_ID: 'dc-client',
  DISCORD_CLIENT_SECRET: 'dc-secret',
  DISCORD_BOT_TOKEN: 'bot',
  DISCORD_GUILD_ID: '123',
}

const OPTIONAL_ENV = {
  GITHUB_APP_ID: '1',
  GITHUB_APP_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
  GITHUB_APP_INSTALLATION_ID: '2',
  GITHUB_ORG: 'neuland-ingolstadt',
  CL_API_KEY: 'cl-key',
  CRON_SECRET: 'cron',
  DISCORD_EVENTS_CHANNEL_ID: '456',
}

describe('getHealthReport', () => {
  test('returns ok when required and optional env are set', () => {
    const report = getHealthReport({ ...REQUIRED_ENV, ...OPTIONAL_ENV })
    expect(report.status).toBe('ok')
    expect(healthHttpStatus(report)).toBe(200)
    expect(report.checks.every(check => check.ok)).toBe(true)
  })

  test('returns degraded when only optional env is missing', () => {
    const report = getHealthReport(REQUIRED_ENV)
    expect(report.status).toBe('degraded')
    expect(healthHttpStatus(report)).toBe(200)
    expect(report.checks.find(c => c.id === 'githubOrgSync')?.ok).toBe(false)
    expect(report.checks.find(c => c.id === 'session')?.ok).toBe(true)
  })

  test('returns unready when a required env is missing', () => {
    const { SESSION_SECRET: _omit, ...rest } = REQUIRED_ENV
    const report = getHealthReport(rest)
    expect(report.status).toBe('unready')
    expect(healthHttpStatus(report)).toBe(503)
    expect(report.checks.find(c => c.id === 'session')?.ok).toBe(false)
  })
})
