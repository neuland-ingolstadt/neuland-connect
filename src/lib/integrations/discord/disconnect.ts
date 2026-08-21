export async function disconnectDiscordConnection(): Promise<void> {
  const { requireSessionUser } = await import('#/lib/session.server')
  const { clearDiscordUserAttributes, getAuthentikUser } = await import(
    '#/lib/authentik/client'
  )
  const { parseUserAttributes } = await import('#/lib/authentik/types')
  const { resolveSessionAuthentikUserId } = await import(
    '#/lib/authentik/session-user'
  )
  const { serverConfig } = await import('#/lib/config')
  const { clearGuildMemberRoles } = await import(
    '#/lib/integrations/discord/guild'
  )

  const sessionData = await requireSessionUser()
  if (!sessionData) {
    throw new Error('Nicht angemeldet')
  }

  const authentikUserId = await resolveSessionAuthentikUserId(sessionData.user)
  const authentikUser = await getAuthentikUser(authentikUserId)
  const attributes = parseUserAttributes(authentikUser.attributes)

  if (attributes.discordId && serverConfig.discord.isRoleSyncConfigured) {
    await clearGuildMemberRoles(attributes.discordId)
  }

  await clearDiscordUserAttributes(authentikUserId)
  const { invalidateCurrentUserCache } = await import(
    '#/server/get-current-user'
  )
  invalidateCurrentUserCache(authentikUserId)
}
