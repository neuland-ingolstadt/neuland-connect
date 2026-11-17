import { describe, expect, test } from 'bun:test'
import {
  isDiscordConnected,
  isGitHubConnected,
  parseUserAttributes,
} from '#/lib/authentik/types'
import { AUTHENTIK_ATTRIBUTES } from '#/lib/constants'

describe('parseUserAttributes', () => {
  test('returns nulls for empty attributes', () => {
    expect(parseUserAttributes(undefined)).toEqual({
      githubUsername: null,
      githubId: null,
      githubConnectedAt: null,
      githubOrgStatus: null,
      githubOrgInvitedAt: null,
      githubOrgLastError: null,
      discordUsername: null,
      discordId: null,
      discordConnectedAt: null,
      discordGuildStatus: null,
      discordGuildJoinedAt: null,
      discordGuildLastError: null,
    })
  })

  test('parses string attributes and known status values', () => {
    const parsed = parseUserAttributes({
      [AUTHENTIK_ATTRIBUTES.GITHUB_USERNAME]: 'alice',
      [AUTHENTIK_ATTRIBUTES.GITHUB_ID]: '42',
      [AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS]: 'member',
      [AUTHENTIK_ATTRIBUTES.DISCORD_USERNAME]: 'alice#0',
      [AUTHENTIK_ATTRIBUTES.DISCORD_ID]: '999',
      [AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_STATUS]: 'member',
    })

    expect(parsed.githubUsername).toBe('alice')
    expect(parsed.githubOrgStatus).toBe('member')
    expect(parsed.discordGuildStatus).toBe('member')
    expect(isGitHubConnected(parsed)).toBe(true)
    expect(isDiscordConnected(parsed)).toBe(true)
  })

  test('reads first array element and rejects unknown org status', () => {
    const parsed = parseUserAttributes({
      [AUTHENTIK_ATTRIBUTES.GITHUB_USERNAME]: ['bob'],
      [AUTHENTIK_ATTRIBUTES.GITHUB_ID]: ['7'],
      [AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS]: 'pending',
    })

    expect(parsed.githubUsername).toBe('bob')
    expect(parsed.githubId).toBe('7')
    expect(parsed.githubOrgStatus).toBeNull()
    expect(isGitHubConnected(parsed)).toBe(true)
  })
})
