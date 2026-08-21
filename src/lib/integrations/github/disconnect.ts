export async function disconnectGitHubConnection(): Promise<void> {
  const { requireSessionUser } = await import('#/lib/session.server')
  const { clearGitHubUserAttributes, getAuthentikUser } = await import(
    '#/lib/authentik/client'
  )
  const { parseUserAttributes } = await import('#/lib/authentik/types')
  const { resolveSessionAuthentikUserId } = await import(
    '#/lib/authentik/session-user'
  )
  const { serverConfig } = await import('#/lib/config')
  const { clearManagedGitHubTeams } = await import(
    '#/lib/integrations/github/teams-sync'
  )

  const sessionData = await requireSessionUser()
  if (!sessionData) {
    throw new Error('Nicht angemeldet')
  }

  const authentikUserId = await resolveSessionAuthentikUserId(sessionData.user)
  const authentikUser = await getAuthentikUser(authentikUserId)
  const attributes = parseUserAttributes(authentikUser.attributes)

  if (attributes.githubUsername && serverConfig.github.isTeamSyncConfigured) {
    await clearManagedGitHubTeams(attributes.githubUsername)
  }

  await clearGitHubUserAttributes(authentikUserId)
  const { invalidateCurrentUserCache } = await import(
    '#/server/get-current-user'
  )
  invalidateCurrentUserCache(authentikUserId)
}
