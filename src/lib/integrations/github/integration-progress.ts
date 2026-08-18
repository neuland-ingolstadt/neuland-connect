import { GITHUB_ORG_STATUSES, type GitHubOrgStatus } from '#/lib/constants'
import { isGitHubInOrg } from '#/lib/integrations/github/org-status-display'

export type IntegrationProgressStep = {
  id: string
  label: string
  complete: boolean
}

type BuildGitHubIntegrationProgressInput = {
  connected: boolean
  githubOrgStatus: GitHubOrgStatus | null
}

export function buildGitHubIntegrationProgress(
  input: BuildGitHubIntegrationProgressInput,
): {
  steps: IntegrationProgressStep[]
  hint: string
  isComplete: boolean
} {
  const isInOrg = isGitHubInOrg(input.githubOrgStatus)
  const isInvited =
    input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED || isInOrg

  const steps: IntegrationProgressStep[] = [
    {
      id: 'connected',
      label: 'Verbunden',
      complete: input.connected,
    },
    {
      id: 'invited',
      label: 'Eingeladen',
      complete: isInvited,
    },
    {
      id: 'in-org',
      label: 'Org-Zugang',
      complete: isInOrg,
    },
  ]

  let hint: string

  if (!input.connected) {
    hint = 'GitHub-Konto verbinden.'
  } else if (input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED) {
    hint = 'Einladung in GitHub annehmen.'
  } else if (isInOrg) {
    hint =
      input.githubOrgStatus === GITHUB_ORG_STATUSES.ADMIN
        ? 'Admin in der Organisation.'
        : 'Mitglied in der Organisation.'
  } else if (!isInvited) {
    hint = 'Einladung folgt automatisch.'
  } else {
    hint = 'Org-Zugang ausstehend.'
  }

  return {
    steps,
    hint,
    isComplete: input.connected && isInOrg,
  }
}
