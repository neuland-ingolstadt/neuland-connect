import type { AccountSetupProgress } from '#/lib/integrations/account-setup'

export const INTEGRATION_CARD_IDS = {
  github: 'integration-github',
  discord: 'integration-discord',
  membership: 'integration-membership',
} as const

export type IntegrationCardId =
  (typeof INTEGRATION_CARD_IDS)[keyof typeof INTEGRATION_CARD_IDS]

const INTEGRATION_CARD_ID_SET = new Set<string>(
  Object.values(INTEGRATION_CARD_IDS),
)

export function isIntegrationCardId(value: string): value is IntegrationCardId {
  return INTEGRATION_CARD_ID_SET.has(value)
}

/** First incomplete Konten card hash target, or undefined when all complete. */
export function firstIncompleteConnectHash(
  progress: AccountSetupProgress,
): IntegrationCardId | undefined {
  if (!progress.githubComplete) {
    return INTEGRATION_CARD_IDS.github
  }
  if (!progress.discordComplete) {
    return INTEGRATION_CARD_IDS.discord
  }
  if (!progress.nextComplete) {
    return INTEGRATION_CARD_IDS.membership
  }
  return undefined
}
