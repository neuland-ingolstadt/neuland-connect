import {
  getAuthentikApiUserId,
  getAuthentikUserGroups,
  getManagedDiscordRoleMap,
  listAllAuthentikUsers,
  patchAuthentikUserAttributes,
} from '#/lib/authentik/client'
import { parseUserAttributes } from '#/lib/authentik/types'
import { mapWithConcurrency } from '#/lib/concurrency'
import { serverConfig } from '#/lib/config'
import { AUTHENTIK_ATTRIBUTES, DISCORD_GUILD_STATUSES } from '#/lib/constants'
import {
  addGuildMember,
  addGuildMemberRole,
  getGuildMember,
  removeGuildMemberRole,
} from '#/lib/integrations/discord/guild'

const RECONCILE_CONCURRENCY = 8

export type SyncUserDiscordRolesResult = {
  authentikUserId: string
  discordUserId: string
  status: 'synced' | 'skipped' | 'error'
  /** Authentik group names mapped to Discord roles */
  desired: string[]
  added: string[]
  removed: string[]
  error?: string
}

export type ReconcileDiscordRolesResult = {
  configured: boolean
  candidates: number
  members: number
  synced: number
  skipped: number
  errors: number
  results: SyncUserDiscordRolesResult[]
}

function desiredRoleIds(
  userGroupNames: string[],
  managedMap: Map<string, string>,
): string[] {
  const roleIds = new Set<string>()

  for (const groupName of userGroupNames) {
    const roleId = managedMap.get(groupName)
    if (roleId) {
      roleIds.add(roleId)
    }
  }

  return [...roleIds].sort((a, b) => a.localeCompare(b))
}

function managedRoleIds(managedMap: Map<string, string>): Set<string> {
  return new Set(managedMap.values())
}

function desiredGroupNames(
  userGroupNames: string[],
  managedMap: Map<string, string>,
): string[] {
  return userGroupNames
    .filter(groupName => managedMap.has(groupName))
    .sort((a, b) => a.localeCompare(b, 'de'))
}

function groupNamesForRoleId(
  roleId: string,
  managedMap: Map<string, string>,
  userGroupNames?: string[],
): string[] {
  const userSet = userGroupNames ? new Set(userGroupNames) : null

  return [...managedMap.entries()]
    .filter(([groupName, mappedRoleId]) => {
      if (mappedRoleId !== roleId) {
        return false
      }

      return userSet ? userSet.has(groupName) : true
    })
    .map(([groupName]) => groupName)
    .sort((a, b) => a.localeCompare(b, 'de'))
}

async function writeGuildMemberStatus(
  authentikUserId: string | number,
  options?: {
    clearError?: boolean
  },
): Promise<void> {
  await patchAuthentikUserAttributes(authentikUserId, {
    set: {
      [AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_STATUS]:
        DISCORD_GUILD_STATUSES.MEMBER,
    },
    setIfAbsent: {
      [AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_JOINED_AT]: new Date().toISOString(),
    },
    remove: options?.clearError
      ? [AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_LAST_ERROR]
      : undefined,
  })
}

async function clearGuildMemberStatus(
  authentikUserId: string | number,
): Promise<void> {
  await patchAuthentikUserAttributes(authentikUserId, {
    remove: [
      AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_STATUS,
      AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_JOINED_AT,
      AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_LAST_ERROR,
    ],
  })
}

async function writeGuildSyncError(
  authentikUserId: string | number,
  message: string,
): Promise<void> {
  await patchAuthentikUserAttributes(authentikUserId, {
    set: {
      [AUTHENTIK_ATTRIBUTES.DISCORD_GUILD_LAST_ERROR]: message,
    },
  })
}

export async function ensureDiscordGuildMembership(
  authentikUserId: string | number,
  discordUserId: string,
  userAccessToken: string,
): Promise<'member' | 'not_in_guild'> {
  if (!serverConfig.discord.isRoleSyncConfigured) {
    return 'not_in_guild'
  }

  try {
    const existing = await getGuildMember(discordUserId)
    if (existing) {
      await writeGuildMemberStatus(authentikUserId, {
        clearError: true,
      })
      return 'member'
    }

    await addGuildMember(discordUserId, userAccessToken)
    await writeGuildMemberStatus(authentikUserId, {
      clearError: true,
    })
    return 'member'
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Discord-Serverbeitritt fehlgeschlagen'

    await writeGuildSyncError(authentikUserId, message).catch(() => undefined)
    return 'not_in_guild'
  }
}

export async function postConnectDiscordSync(
  authentikUserId: string | number,
  discordUserId: string,
  userAccessToken: string,
): Promise<void> {
  const membership = await ensureDiscordGuildMembership(
    authentikUserId,
    discordUserId,
    userAccessToken,
  )

  if (membership === 'member') {
    await syncUserDiscordRoles(authentikUserId, discordUserId)
  }
}

export async function syncUserDiscordRoles(
  authentikUserId: string | number,
  discordUserId: string,
  options?: {
    managedMap?: Map<string, string>
    userGroups?: string[]
  },
): Promise<SyncUserDiscordRolesResult> {
  const userId = String(authentikUserId)

  if (!serverConfig.discord.isRoleSyncConfigured) {
    return {
      authentikUserId: userId,
      discordUserId,
      status: 'skipped',
      desired: [],
      added: [],
      removed: [],
    }
  }

  try {
    const member = await getGuildMember(discordUserId)
    if (!member) {
      await clearGuildMemberStatus(authentikUserId)
      return {
        authentikUserId: userId,
        discordUserId,
        status: 'skipped',
        desired: [],
        added: [],
        removed: [],
      }
    }

    const managedMap = options?.managedMap ?? (await getManagedDiscordRoleMap())
    const managedIds = managedRoleIds(managedMap)

    if (managedIds.size === 0) {
      await writeGuildMemberStatus(authentikUserId, {
        clearError: true,
      })
      return {
        authentikUserId: userId,
        discordUserId,
        status: 'synced',
        desired: [],
        added: [],
        removed: [],
      }
    }

    const userGroups =
      options?.userGroups ?? (await getAuthentikUserGroups(authentikUserId))
    const desiredRoleIdList = desiredRoleIds(userGroups, managedMap)
    const desiredSet = new Set(desiredRoleIdList)
    const desired = desiredGroupNames(userGroups, managedMap)
    const currentManaged = member.roles.filter(roleId => managedIds.has(roleId))
    const currentManagedSet = new Set(currentManaged)

    const added: string[] = []
    const removed: string[] = []

    for (const roleId of desiredRoleIdList) {
      if (!currentManagedSet.has(roleId)) {
        await addGuildMemberRole(discordUserId, roleId)
        added.push(...groupNamesForRoleId(roleId, managedMap, userGroups))
      }
    }

    for (const roleId of currentManaged) {
      if (!desiredSet.has(roleId)) {
        await removeGuildMemberRole(discordUserId, roleId)
        removed.push(...groupNamesForRoleId(roleId, managedMap))
      }
    }

    await writeGuildMemberStatus(authentikUserId, {
      clearError: true,
    })

    return {
      authentikUserId: userId,
      discordUserId,
      status: 'synced',
      desired,
      added,
      removed,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Discord-Sync-Fehler'

    await writeGuildSyncError(authentikUserId, message).catch(() => undefined)

    return {
      authentikUserId: userId,
      discordUserId,
      status: 'error',
      desired: [],
      added: [],
      removed: [],
      error: message,
    }
  }
}

export async function reconcileDiscordRoles(): Promise<ReconcileDiscordRolesResult> {
  if (!serverConfig.discord.isRoleSyncConfigured) {
    return {
      configured: false,
      candidates: 0,
      members: 0,
      synced: 0,
      skipped: 0,
      errors: 0,
      results: [],
    }
  }

  const [managedMap, users] = await Promise.all([
    getManagedDiscordRoleMap(),
    listAllAuthentikUsers(),
  ])

  const candidates = users
    .map(user => {
      const attributes = parseUserAttributes(user.attributes)
      if (!attributes.discordId) {
        return null
      }

      return {
        authentikUserId: getAuthentikApiUserId(user),
        discordUserId: attributes.discordId,
      }
    })
    .filter(
      (entry): entry is { authentikUserId: string; discordUserId: string } =>
        entry !== null,
    )

  const results = await mapWithConcurrency(
    candidates,
    RECONCILE_CONCURRENCY,
    async candidate => {
      const userGroups = await getAuthentikUserGroups(candidate.authentikUserId)
      return syncUserDiscordRoles(
        candidate.authentikUserId,
        candidate.discordUserId,
        {
          managedMap,
          userGroups,
        },
      )
    },
  )

  return {
    configured: true,
    candidates: candidates.length,
    members: results.filter(result => result.status === 'synced').length,
    synced: results.filter(result => result.status === 'synced').length,
    skipped: results.filter(result => result.status === 'skipped').length,
    errors: results.filter(result => result.status === 'error').length,
    results,
  }
}
