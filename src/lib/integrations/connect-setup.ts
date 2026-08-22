import { buildDiscordIntegrationProgress } from '#/lib/integrations/discord/integration-progress'
import { buildGitHubIntegrationProgress } from '#/lib/integrations/github/integration-progress'
import type { CurrentUser } from '#/server/get-current-user'

export type ConnectSetupProgress = {
  doneCount: number
  totalCount: number
  allComplete: boolean
  githubComplete: boolean
  discordComplete: boolean
  nextComplete: boolean
}

export function getConnectSetupProgress(
  user: CurrentUser,
): ConnectSetupProgress {
  const github = buildGitHubIntegrationProgress({
    connected: user.githubConnected,
    githubOrgStatus: user.attributes.githubOrgStatus,
    teamSyncEnabled: user.teamSyncEnabled,
  })
  const discord = buildDiscordIntegrationProgress({
    connected: user.discordConnected,
    discordGuildStatus: user.attributes.discordGuildStatus,
  })

  const githubComplete = github.isComplete
  const discordComplete = discord.isComplete
  const nextComplete = user.nextSession.signedIn

  const setupItems = [githubComplete, discordComplete, nextComplete]

  const doneCount = setupItems.filter(Boolean).length
  const totalCount = setupItems.length

  return {
    doneCount,
    totalCount,
    allComplete: doneCount === totalCount,
    githubComplete,
    discordComplete,
    nextComplete,
  }
}
