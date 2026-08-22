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
  const discord = user.discordOAuthEnabled
    ? buildDiscordIntegrationProgress({
        connected: user.discordConnected,
        discordGuildStatus: user.attributes.discordGuildStatus,
        roleSyncEnabled: user.roleSyncEnabled,
      })
    : null

  const githubComplete = github.isComplete
  const discordComplete = discord ? discord.isComplete : true
  const nextComplete = user.nextSession.signedIn

  const setupItems = [githubComplete, nextComplete]
  if (discord) {
    setupItems.push(discordComplete)
  }

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
