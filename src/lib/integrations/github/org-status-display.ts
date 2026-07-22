import type { GitHubOrgStatus } from '#/lib/constants'

type OrgStatusBadgeVariant = 'success' | 'default' | 'muted'

export function getGitHubOrgStatusDisplay(status: GitHubOrgStatus | null): {
  label: string
  variant: OrgStatusBadgeVariant
} {
  switch (status) {
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
