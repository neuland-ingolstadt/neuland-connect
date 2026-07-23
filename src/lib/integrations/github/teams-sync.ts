import {
  getAuthentikApiUserId,
  getAuthentikUserGroups,
  getManagedGitHubTeamMap,
  getManagedGitHubTeams,
  listAllAuthentikUsers,
} from '#/lib/authentik/client'
import { parseUserAttributes } from '#/lib/authentik/types'
import { mapWithConcurrency } from '#/lib/concurrency'
import { serverConfig } from '#/lib/config'
import { GITHUB_ORG_STATUSES } from '#/lib/constants'
import {
  addUserToTeam,
  getOrgMembershipState,
  listGitHubTeamMemberLogins,
  listUserManagedTeamSlugs,
  removeUserFromTeam,
  resetInstallationTokenCache,
} from '#/lib/integrations/github/org'

/** Keep GitHub under rate limits while cutting wall-clock time. */
const RECONCILE_CONCURRENCY = 8

export type SyncUserTeamsResult = {
  authentikUserId: string
  githubUsername: string
  status: 'synced' | 'skipped' | 'error'
  desired: string[]
  added: string[]
  removed: string[]
  error?: string
}

export type ReconcileTeamsSyncResult = {
  configured: boolean
  teams: number
  candidates: number
  added: number
  removed: number
  errors: number
  results: Array<{
    teamSlug: string
    added: string[]
    removed: string[]
    error?: string
  }>
}

function isActiveOrgMember(
  githubOrgStatus: ReturnType<typeof parseUserAttributes>['githubOrgStatus'],
): boolean {
  return (
    githubOrgStatus === GITHUB_ORG_STATUSES.MEMBER ||
    githubOrgStatus === GITHUB_ORG_STATUSES.ADMIN
  )
}

function desiredTeamSlugs(
  userGroupNames: string[],
  managedMap: Map<string, string>,
): string[] {
  const slugs = new Set<string>()
  for (const groupName of userGroupNames) {
    const slug = managedMap.get(groupName)
    if (slug) {
      slugs.add(slug)
    }
  }
  return [...slugs].sort((a, b) => a.localeCompare(b))
}

function normalizeLogin(login: string): string {
  return login.toLowerCase()
}

export async function syncUserGitHubTeams(
  authentikUserId: string | number,
  githubUsername: string,
  options?: {
    managedMap?: Map<string, string>
    userGroups?: string[]
    /** When true, trust caller that the user is an active org member. */
    assumeOrgMember?: boolean
  },
): Promise<SyncUserTeamsResult> {
  const userId = String(authentikUserId)

  if (!serverConfig.github.isTeamSyncConfigured) {
    return {
      authentikUserId: userId,
      githubUsername,
      status: 'skipped',
      desired: [],
      added: [],
      removed: [],
    }
  }

  const parentGroup = serverConfig.github.teamParentGroup
  if (!parentGroup) {
    return {
      authentikUserId: userId,
      githubUsername,
      status: 'skipped',
      desired: [],
      added: [],
      removed: [],
    }
  }

  try {
    if (!options?.assumeOrgMember) {
      const membershipState = await getOrgMembershipState(githubUsername)
      if (membershipState !== 'active') {
        return {
          authentikUserId: userId,
          githubUsername,
          status: 'skipped',
          desired: [],
          added: [],
          removed: [],
        }
      }
    }

    const managedMap =
      options?.managedMap ?? (await getManagedGitHubTeamMap(parentGroup))
    const managedSlugs = new Set(managedMap.values())

    if (managedSlugs.size === 0) {
      return {
        authentikUserId: userId,
        githubUsername,
        status: 'synced',
        desired: [],
        added: [],
        removed: [],
      }
    }

    const userGroups =
      options?.userGroups ?? (await getAuthentikUserGroups(authentikUserId))
    const desired = desiredTeamSlugs(userGroups, managedMap)
    const desiredSet = new Set(desired)

    const currentManaged = await listUserManagedTeamSlugs(
      githubUsername,
      managedSlugs,
    )
    const currentManagedSet = new Set(currentManaged)

    const added: string[] = []
    const removed: string[] = []

    for (const slug of desired) {
      if (!currentManagedSet.has(slug)) {
        await addUserToTeam(githubUsername, slug)
        added.push(slug)
      }
    }

    for (const slug of currentManaged) {
      if (!desiredSet.has(slug)) {
        await removeUserFromTeam(githubUsername, slug)
        removed.push(slug)
      }
    }

    return {
      authentikUserId: userId,
      githubUsername,
      status: 'synced',
      desired,
      added,
      removed,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Team-Sync-Fehler'

    return {
      authentikUserId: userId,
      githubUsername,
      status: 'error',
      desired: [],
      added: [],
      removed: [],
      error: message,
    }
  }
}

/**
 * Cron reconcile: team-centric (O(teams) reads), not per-user membership probes.
 * Desired members = Authentik child-group members ∩ linked org members.
 * Removals only touch Connect-known users (linked + org member); manual GitHub
 * team members outside Connect are left alone.
 */
export async function reconcileGitHubTeamMembership(): Promise<ReconcileTeamsSyncResult> {
  if (!serverConfig.github.isTeamSyncConfigured) {
    return {
      configured: false,
      teams: 0,
      candidates: 0,
      added: 0,
      removed: 0,
      errors: 0,
      results: [],
    }
  }

  const parentGroup = serverConfig.github.teamParentGroup
  if (!parentGroup) {
    return {
      configured: false,
      teams: 0,
      candidates: 0,
      added: 0,
      removed: 0,
      errors: 0,
      results: [],
    }
  }

  resetInstallationTokenCache()

  const [managedTeams, users] = await Promise.all([
    getManagedGitHubTeams(parentGroup),
    listAllAuthentikUsers(),
  ])

  /** Authentik PK → GitHub login for org-active linked users */
  const eligibleByPk = new Map<string, string>()
  /** lowercase login → original login */
  const loginByNormalized = new Map<string, string>()
  for (const user of users) {
    const attributes = parseUserAttributes(user.attributes)
    if (!attributes.githubUsername || !attributes.githubId) {
      continue
    }
    if (!isActiveOrgMember(attributes.githubOrgStatus)) {
      continue
    }
    const login = attributes.githubUsername
    eligibleByPk.set(getAuthentikApiUserId(user), login)
    loginByNormalized.set(normalizeLogin(login), login)
  }

  const results = await mapWithConcurrency(
    managedTeams,
    RECONCILE_CONCURRENCY,
    async team => {
      try {
        const desiredLogins = new Set<string>()
        for (const memberPk of team.memberPks) {
          const login = eligibleByPk.get(memberPk)
          if (login) {
            desiredLogins.add(normalizeLogin(login))
          }
        }

        const currentLogins = await listGitHubTeamMemberLogins(team.slug)
        const currentNormalized = new Map(
          currentLogins.map(login => [normalizeLogin(login), login]),
        )

        const toAdd: string[] = []
        for (const desired of desiredLogins) {
          if (!currentNormalized.has(desired)) {
            toAdd.push(loginByNormalized.get(desired) ?? desired)
          }
        }

        const toRemove: string[] = []
        for (const [normalized, original] of currentNormalized) {
          // Only remove Connect-managed users (linked + org member). Leave
          // manually added GitHub members that Connect does not know about.
          if (
            loginByNormalized.has(normalized) &&
            !desiredLogins.has(normalized)
          ) {
            toRemove.push(original)
          }
        }

        await mapWithConcurrency(toAdd, RECONCILE_CONCURRENCY, login =>
          addUserToTeam(login, team.slug),
        )
        await mapWithConcurrency(toRemove, RECONCILE_CONCURRENCY, login =>
          removeUserFromTeam(login, team.slug),
        )

        return {
          teamSlug: team.slug,
          added: toAdd,
          removed: toRemove,
        }
      } catch (error) {
        return {
          teamSlug: team.slug,
          added: [] as string[],
          removed: [] as string[],
          error:
            error instanceof Error
              ? error.message
              : 'Unbekannter Team-Sync-Fehler',
        }
      }
    },
  )

  return {
    configured: true,
    teams: managedTeams.length,
    candidates: eligibleByPk.size,
    added: results.reduce((sum, result) => sum + result.added.length, 0),
    removed: results.reduce((sum, result) => sum + result.removed.length, 0),
    errors: results.filter(result => result.error).length,
    results,
  }
}
