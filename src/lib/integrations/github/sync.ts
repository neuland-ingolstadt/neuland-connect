import {
  getAuthentikApiUserId,
  listAllAuthentikUsers,
  patchAuthentikUserAttributes,
} from '#/lib/authentik/client'
import { parseUserAttributes } from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import { AUTHENTIK_ATTRIBUTES, GITHUB_ORG_STATUSES } from '#/lib/constants'
import {
  getOrgMembershipState,
  hasPendingOrgInvitation,
  inviteUserToOrg,
  resetInstallationTokenCache,
} from '#/lib/integrations/github/org'

export type SyncUserOrgResult = {
  authentikUserId: string
  githubUsername: string
  status: 'member' | 'invited' | 'skipped' | 'error'
  error?: string
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
    const membershipState = await getOrgMembershipState(githubUsername)

    if (membershipState === 'active') {
      await writeOrgStatus(authentikUserId, GITHUB_ORG_STATUSES.MEMBER)
      return {
        authentikUserId: userId,
        githubUsername,
        status: 'member',
      }
    }

    if (
      membershipState === 'pending' ||
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
      await writeOrgStatus(authentikUserId, GITHUB_ORG_STATUSES.MEMBER)
      return {
        authentikUserId: userId,
        githubUsername,
        status: 'member',
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
    if (!attributes.githubUsername || !attributes.githubId) {
      continue
    }

    if (attributes.githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER) {
      continue
    }

    const result = await syncUserOrgStatus(
      getAuthentikApiUserId(user),
      attributes.githubUsername,
      attributes.githubId,
    )
    results.push(result)
  }

  return {
    configured: true,
    processed: results.length,
    members: results.filter(result => result.status === 'member').length,
    invited: results.filter(result => result.status === 'invited').length,
    skipped: results.filter(result => result.status === 'skipped').length,
    errors: results.filter(result => result.status === 'error').length,
    results,
  }
}
