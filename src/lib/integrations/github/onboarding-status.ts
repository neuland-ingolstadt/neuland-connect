import { GITHUB_ORG_STATUSES } from '#/lib/constants'

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
  githubOrgStatus: 'invited' | 'member' | null
}

function resolveStepStates({
  githubConnected,
  githubOrgStatus,
}: BuildOnboardingStepsInput) {
  const isInvited =
    githubOrgStatus === GITHUB_ORG_STATUSES.INVITED ||
    githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER
  const isInOrg = githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER

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
          ? 'Einladung versendet.'
          : input.githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER
            ? 'Bereits Mitglied der Organisation.'
            : 'Folgt automatisch nach der GitHub-Verbindung.',
    },
    {
      id: 'in-org',
      label: 'Org-Zugang',
      state: states['in-org'],
      hint:
        input.githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER
          ? 'Zugang zu den Repos aktiv.'
          : 'GitHub-Einladung annehmen.',
    },
  ]
}
