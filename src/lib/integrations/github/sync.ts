import {
  getAuthentikApiUserId,
  listAllAuthentikUsers,
  patchAuthentikUserAttributes,
} from '#/lib/authentik/client'
import { parseUserAttributes } from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import { AUTHENTIK_ATTRIBUTES, GITHUB_ORG_STATUSES } from '#/lib/constants'
import {
  getOrgMembershipInfo,
  hasPendingOrgInvitation,
  inviteUserToOrg,
  resetInstallationTokenCache,
} from '#/lib/integrations/github/org'

export type SyncUserOrgResult = {
  authentikUserId: string
  githubUsername: string
  status: 'member' | 'admin' | 'invited' | 'skipped' | 'error'
  error?: string
}

function activeOrgStatus(
  role: 'admin' | 'member',
): (typeof GITHUB_ORG_STATUSES)[keyof typeof GITHUB_ORG_STATUSES] {
  return role === 'admin'
    ? GITHUB_ORG_STATUSES.ADMIN
    : GITHUB_ORG_STATUSES.MEMBER
}

export type ReconcileOrgSyncResult = {
  configured: boolean
  processed: number
  members: number
  invited: number
  skipped: number
  errors: number
  results: SyncUserOrgResult[]
}

function shouldReconcileOrgStatus(
  githubOrgStatus: ReturnType<typeof parseUserAttributes>['githubOrgStatus'],
): boolean {
  return (
    githubOrgStatus !== GITHUB_ORG_STATUSES.MEMBER &&
    githubOrgStatus !== GITHUB_ORG_STATUSES.ADMIN
  )
}

async function clearOrphanedGitHubOrgAttributes(
  authentikUserId: string | number,
): Promise<void> {
  await patchAuthentikUserAttributes(authentikUserId, {
    remove: [
      AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS,
      AUTHENTIK_ATTRIBUTES.GITHUB_ORG_INVITED_AT,
      AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR,
    ],
  })
}
async function writeOrgStatus(
  authentikUserId: string | number,
  status: (typeof GITHUB_ORG_STATUSES)[keyof typeof GITHUB_ORG_STATUSES],
  options?: { invitedAt?: boolean },
): Promise<void> {
  const set: Record<string, string> = {
    [AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS]: status,
  }

  if (options?.invitedAt) {
    set[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_INVITED_AT] = new Date().toISOString()
  }

  await patchAuthentikUserAttributes(authentikUserId, {
    set,
    remove: [AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR],
  })
}

async function writeOrgSyncError(
  authentikUserId: string | number,
  message: string,
): Promise<void> {
  await patchAuthentikUserAttributes(authentikUserId, {
    set: {
      [AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR]: message.slice(0, 500),
    },
  })
}

export async function syncUserOrgStatus(
  authentikUserId: string | number,
  githubUsername: string,
  githubId: string,
): Promise<SyncUserOrgResult> {
  const userId = String(authentikUserId)

  if (!serverConfig.github.isOrgSyncConfigured) {
    return {
      authentikUserId: userId,
      githubUsername,
      status: 'skipped',
    }
  }

  try {
    const membership = await getOrgMembershipInfo(githubUsername)

    if (membership.state === 'active' && membership.role) {
      const status = activeOrgStatus(membership.role)
      await writeOrgStatus(authentikUserId, status)
      return {
        authentikUserId: userId,
        githubUsername,
        status: membership.role,
      }
    }

    if (
      membership.state === 'pending' ||
      (await hasPendingOrgInvitation(githubUsername, githubId))
    ) {
      await writeOrgStatus(authentikUserId, GITHUB_ORG_STATUSES.INVITED)
      return {
        authentikUserId: userId,
        githubUsername,
        status: 'invited',
      }
    }

    const inviteResult = await inviteUserToOrg(Number(githubId), githubUsername)

    if (inviteResult === 'already_member') {
      const refreshedMembership = await getOrgMembershipInfo(githubUsername)
      const role = refreshedMembership.role ?? 'member'
      await writeOrgStatus(authentikUserId, activeOrgStatus(role))
      return {
        authentikUserId: userId,
        githubUsername,
        status: role,
      }
    }

    await writeOrgStatus(authentikUserId, GITHUB_ORG_STATUSES.INVITED, {
      invitedAt: inviteResult === 'invited',
    })

    return {
      authentikUserId: userId,
      githubUsername,
      status: 'invited',
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Sync-Fehler'

    try {
      await writeOrgSyncError(authentikUserId, message)
    } catch (patchError) {
      console.error(
        `[github-org] Failed to persist sync error for user ${userId}:`,
        patchError,
      )
    }

    return {
      authentikUserId: userId,
      githubUsername,
      status: 'error',
      error: message,
    }
  }
}

export function enqueueOrgInvite(
  authentikUserId: string | number,
  githubUsername: string,
  githubId: string,
): void {
  if (!serverConfig.github.isOrgSyncConfigured) {
    console.warn(
      '[github-org] GitHub App not configured - org invite skipped for',
      githubUsername,
    )
    return
  }

  void syncUserOrgStatus(authentikUserId, githubUsername, githubId).catch(
    error => {
      console.error(
        `[github-org] Background org invite failed for ${githubUsername}:`,
        error,
      )
    },
  )
}

export async function reconcileGitHubOrgMembership(): Promise<ReconcileOrgSyncResult> {
  if (!serverConfig.github.isOrgSyncConfigured) {
    return {
      configured: false,
      processed: 0,
      members: 0,
      invited: 0,
      skipped: 0,
      errors: 0,
      results: [],
    }
  }

  resetInstallationTokenCache()

  const users = await listAllAuthentikUsers()
  const results: SyncUserOrgResult[] = []

  for (const user of users) {
    const attributes = parseUserAttributes(user.attributes)
    const authentikUserId = getAuthentikApiUserId(user)
    const hasGitHubConnection = Boolean(
      attributes.githubUsername && attributes.githubId,
    )

    if (!hasGitHubConnection) {
      if (attributes.githubOrgStatus) {
        await clearOrphanedGitHubOrgAttributes(authentikUserId)
      }
      continue
    }

    if (!shouldReconcileOrgStatus(attributes.githubOrgStatus)) {
      continue
    }

    const githubUsername = attributes.githubUsername
    const githubId = attributes.githubId
    if (!githubUsername || !githubId) {
      continue
    }

    const result = await syncUserOrgStatus(
      authentikUserId,
      githubUsername,
      githubId,
    )
    results.push(result)
  }

  return {
    configured: true,
    processed: results.length,
    members: results.filter(
      result => result.status === 'member' || result.status === 'admin',
    ).length,
    invited: results.filter(result => result.status === 'invited').length,
    skipped: results.filter(result => result.status === 'skipped').length,
    errors: results.filter(result => result.status === 'error').length,
    results,
  }
}
