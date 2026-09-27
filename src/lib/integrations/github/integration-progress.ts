import { GITHUB_ORG_STATUSES, type GitHubOrgStatus } from '#/lib/constants'
import type { Locale } from '#/lib/i18n/messages'
import { translate } from '#/lib/i18n/messages'
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
  locale: Locale = 'de',
): {
  steps: IntegrationProgressStep[]
  hint: string
  isComplete: boolean
} {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const isInOrg = isGitHubInOrg(input.githubOrgStatus)
  const isInvited =
    input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED || isInOrg
  const isAdmin = input.githubOrgStatus === GITHUB_ORG_STATUSES.ADMIN

  const steps: IntegrationProgressStep[] = [
    {
      id: 'connected',
      label: t('github.progress.connected'),
      complete: input.connected,
    },
    {
      id: 'invited',
      label: t('github.progress.invited'),
      complete: isInvited,
    },
    {
      id: 'in-org',
      label: t('github.progress.inOrg'),
      complete: isInOrg,
    },
  ]

  if (input.teamSyncEnabled) {
    steps.push({
      id: 'teams',
      label: t('github.progress.teams'),
      complete: isInOrg,
    })
  }

  let hint: string

  if (!input.connected) {
    hint = t('github.hint.connect')
  } else if (input.githubOrgStatus === GITHUB_ORG_STATUSES.INVITED) {
    hint = t('github.hint.invited')
  } else if (isInOrg) {
    if (input.teamSyncEnabled) {
      hint = isAdmin ? t('github.hint.admin') : t('github.hint.member')
    } else {
      hint = isAdmin ? t('github.hint.adminFull') : t('github.hint.memberFull')
    }
  } else if (!isInvited) {
    hint = t('github.hint.pending')
  } else {
    hint = t('github.hint.waiting')
  }

  return {
    steps,
    hint,
    isComplete: input.connected && isInOrg,
  }
}
