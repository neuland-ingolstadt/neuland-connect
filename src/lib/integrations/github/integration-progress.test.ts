import { describe, expect, test } from 'bun:test'
import { buildGitHubIntegrationProgress } from '#/lib/integrations/github/integration-progress'

describe('buildGitHubIntegrationProgress', () => {
  test('incomplete when not connected', () => {
    const progress = buildGitHubIntegrationProgress({
      connected: false,
      githubOrgStatus: null,
      teamSyncEnabled: false,
    })

    expect(progress.isComplete).toBe(false)
    expect(progress.steps.map(s => s.complete)).toEqual([false, false, false])
  })

  test('invited marks invite step but not org access', () => {
    const progress = buildGitHubIntegrationProgress({
      connected: true,
      githubOrgStatus: 'invited',
      teamSyncEnabled: true,
    })

    expect(progress.isComplete).toBe(false)
    expect(progress.steps.find(s => s.id === 'invited')?.complete).toBe(true)
    expect(progress.steps.find(s => s.id === 'in-org')?.complete).toBe(false)
    expect(progress.steps.find(s => s.id === 'teams')?.complete).toBe(false)
  })

  test('member completes org and optional teams step', () => {
    const progress = buildGitHubIntegrationProgress({
      connected: true,
      githubOrgStatus: 'member',
      teamSyncEnabled: true,
    })

    expect(progress.isComplete).toBe(true)
    expect(progress.steps.every(s => s.complete)).toBe(true)
  })

  test('omits teams step when team sync is disabled', () => {
    const progress = buildGitHubIntegrationProgress({
      connected: true,
      githubOrgStatus: 'admin',
      teamSyncEnabled: false,
    })

    expect(progress.steps.some(s => s.id === 'teams')).toBe(false)
    expect(progress.isComplete).toBe(true)
  })
})
