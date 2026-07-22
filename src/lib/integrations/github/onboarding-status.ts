import { GITHUB_ORG_STATUSES, type GitHubOrgStatus } from '#/lib/constants'
import { isGitHubInOrg } from '#/lib/integrations/github/org-status-display'

export type OnboardingStepId = 'member' | 'connected' | 'invited' | 'in-org'

export type OnboardingStepState = 'complete' | 'current' | 'upcoming'

export type OnboardingStep = {
  id: OnboardingStepId
  label: string
  state: OnboardingStepState
  hint: string
}

type BuildOnboardingStepsInput = {
  githubConnected: boolean
  githubOrgStatus: GitHubOrgStatus | null
}

function resolveStepStates({
  githubConnected,
  githubOrgStatus,
}: BuildOnboardingStepsInput) {
  const isInOrg = isGitHubInOrg(githubOrgStatus)
  const isInvited = githubOrgStatus === GITHUB_ORG_STATUSES.INVITED || isInOrg

  const completed = {
    member: true,
    connected: githubConnected,
    invited: isInvited,
    inOrg: isInOrg,
  }

  const order: OnboardingStepId[] = ['member', 'connected', 'invited', 'in-org']

  let currentAssigned = false

  return order.reduce(
    (acc, stepId) => {
      const key =
        stepId === 'in-org'
          ? 'inOrg'
          : (stepId as 'member' | 'connected' | 'invited')

      if (completed[key]) {
        acc[stepId] = 'complete'
        return acc
      }

      if (!currentAssigned) {
        acc[stepId] = 'current'
        currentAssigned = true
        return acc
      }

      acc[stepId] = 'upcoming'
      return acc
    },
    {} as Record<OnboardingStepId, OnboardingStepState>,
  )
}

export function buildOnboardingSteps(
  input: BuildOnboardingStepsInput,
): OnboardingStep[] {
  const states = resolveStepStates(input)

  return [
    {
      id: 'member',
      label: 'Mitglied',
      state: states.member,
      hint: 'Angemeldet als Vereinsmitglied.',
    },
    {
      id: 'connected',
      label: 'Verbunden',
      state: states.connected,
      hint: input.githubConnected
        ? 'GitHub-Konto verbunden.'
        : 'GitHub-Konto unten verbinden.',
    },
    {
      id: 'invited',
      label: 'Eingeladen',
      state: states.invited,
      hint:
        input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED
          ? 'Einladung versendet - als Nächstes in GitHub annehmen.'
          : isGitHubInOrg(input.githubOrgStatus)
            ? 'Bereits in der Organisation.'
            : 'Folgt automatisch nach der GitHub-Verbindung.',
    },
    {
      id: 'in-org',
      label: 'Org-Zugang',
      state: states['in-org'],
      hint:
        input.githubOrgStatus === GITHUB_ORG_STATUSES.ADMIN
          ? 'Admin in der Organisation.'
          : input.githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER
            ? 'Mitglied in der Organisation.'
            : input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED
              ? 'Prüf deine GitHub-Benachrichtigungen und nimm die Einladung an.'
              : 'GitHub-Einladung annehmen.',
    },
  ]
}
