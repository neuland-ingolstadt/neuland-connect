export async function disconnectGitHubConnection(): Promise<void> {
  const { requireSessionUser } = await import('#/lib/session.server')
  const { clearGitHubUserAttributes } = await import('#/lib/authentik/client')
  const { resolveSessionAuthentikUserId } = await import(
    '#/lib/authentik/session-user'
  )

  const sessionData = await requireSessionUser()
  if (!sessionData) {
    throw new Error('Nicht angemeldet')
  }

  const authentikUserId = await resolveSessionAuthentikUserId(sessionData.user)
  await clearGitHubUserAttributes(authentikUserId)
}
