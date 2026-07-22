import type { GitHubOrgStatus } from '#/lib/constants'
import { GITHUB_ORG_STATUSES } from '#/lib/constants'

type OrgStatusBadgeVariant = 'success' | 'default' | 'muted'

export function isGitHubInOrg(status: GitHubOrgStatus | null): boolean {
  return (
    status === GITHUB_ORG_STATUSES.MEMBER ||
    status === GITHUB_ORG_STATUSES.ADMIN
  )
}

export function getGitHubOrgStatusDisplay(status: GitHubOrgStatus | null): {
  label: string
  variant: OrgStatusBadgeVariant
} {
  switch (status) {
    case 'admin':
      return { label: 'Admin', variant: 'success' }
    case 'member':
      return { label: 'Mitglied', variant: 'success' }
    case 'invited':
      return { label: 'Eingeladen', variant: 'default' }
    default:
      return { label: 'Ausstehend', variant: 'muted' }
  }
}

export function githubProfileUrl(username: string): string {
  return `https://github.com/${username}`
}

export function githubOrgInvitationUrl(org: string): string {
  return `https://github.com/orgs/${org}/invitation`
}
