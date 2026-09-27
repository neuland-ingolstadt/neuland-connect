import type { GitHubOrgStatus } from '#/lib/constants'
import { GITHUB_ORG_STATUSES } from '#/lib/constants'
import type { Locale } from '#/lib/i18n/messages'
import { translate } from '#/lib/i18n/messages'

type OrgStatusBadgeVariant = 'success' | 'default' | 'muted'

export function isGitHubInOrg(status: GitHubOrgStatus | null): boolean {
  return (
    status === GITHUB_ORG_STATUSES.MEMBER ||
    status === GITHUB_ORG_STATUSES.ADMIN
  )
}

export function getGitHubOrgStatusDisplay(
  status: GitHubOrgStatus | null,
  locale: Locale = 'de',
): {
  label: string
  variant: OrgStatusBadgeVariant
} {
  switch (status) {
    case 'admin':
      return {
        label: translate(locale, 'github.status.admin'),
        variant: 'success',
      }
    case 'member':
      return {
        label: translate(locale, 'github.status.member'),
        variant: 'success',
      }
    case 'invited':
      return {
        label: translate(locale, 'github.status.invited'),
        variant: 'default',
      }
    default:
      return {
        label: translate(locale, 'github.status.pending'),
        variant: 'muted',
      }
  }
}

export function githubProfileUrl(username: string): string {
  return `https://github.com/${username}`
}

export function githubOrgInvitationUrl(org: string): string {
  return `https://github.com/orgs/${org}/invitation`
}
