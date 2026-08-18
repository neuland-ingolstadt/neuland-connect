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
  teamSyncEnabled: boolean
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
  const isAdmin = input.githubOrgStatus === GITHUB_ORG_STATUSES.ADMIN

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

  if (input.teamSyncEnabled) {
    steps.push({
      id: 'teams',
      label: 'Teams',
      complete: isInOrg,
    })
  }

  let hint: string

  if (!input.connected) {
    hint = 'GitHub-Konto verbinden.'
  } else if (input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED) {
    hint = 'Einladung in GitHub annehmen.'
  } else if (isInOrg) {
    if (input.teamSyncEnabled) {
      hint = isAdmin
        ? 'Admin in der Organisation – Teams werden synchronisiert.'
        : 'In der Organisation – Teams werden synchronisiert.'
    } else {
      hint = isAdmin ? 'Admin in der Organisation.' : 'In der Organisation.'
    }
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
