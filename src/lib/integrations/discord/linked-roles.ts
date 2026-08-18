import {
  getAuthentikApiUserId,
  getAuthentikUserGroups,
} from '#/lib/authentik/client'
import type { AuthentikUserResponse } from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import { APP_NAME } from '#/lib/constants'
import {
  getProfileRessortGroup,
  isHonorProfileGroup,
  isVorstandProfileGroup,
  PROFILE_RESSORT_GROUPS,
} from '#/lib/profile-groups'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/** Discord BOOLEAN metadata: string "1" / "0". */
const BOOL_TRUE = '1'
const BOOL_FALSE = '0'

/** ApplicationRoleConnectionMetadataType.BOOLEAN_EQUAL */
const BOOLEAN_EQUAL = 7

export const DISCORD_ROLE_CONNECTION_KEYS = {
  IS_MEMBER: 'is_member',
  IS_VORSTAND: 'is_vorstand',
  IS_EHRENMITGLIED: 'is_ehrenmitglied',
  IS_ORGANISATION: 'is_organisation',
  IS_ENGINEERING: 'is_engineering',
} as const

export type DiscordRoleConnectionMetadataRecord = {
  type: number
  key: string
  name: string
  description: string
}

/**
 * Max 5 records. Admins pick these as Linked Role requirements
 * (Server Settings → Roles → Links).
 */
export const DISCORD_ROLE_CONNECTION_METADATA: DiscordRoleConnectionMetadataRecord[] =
  [
    {
      type: BOOLEAN_EQUAL,
      key: DISCORD_ROLE_CONNECTION_KEYS.IS_MEMBER,
      name: 'Mitglied',
      description: 'Aktives Vereinsmitglied in Authentik',
    },
    {
      type: BOOLEAN_EQUAL,
      key: DISCORD_ROLE_CONNECTION_KEYS.IS_VORSTAND,
      name: 'Vorstand',
      description: 'Mitglied der Authentik-Gruppe Vorstand',
    },
    {
      type: BOOLEAN_EQUAL,
      key: DISCORD_ROLE_CONNECTION_KEYS.IS_EHRENMITGLIED,
      name: 'Ehrenmitglied',
      description: 'Ehrenmitglied laut Authentik-Gruppe',
    },
    {
      type: BOOLEAN_EQUAL,
      key: DISCORD_ROLE_CONNECTION_KEYS.IS_ORGANISATION,
      name: 'Ressort Organisation',
      description: 'Mitglied der Authentik-Gruppe organisation',
    },
    {
      type: BOOLEAN_EQUAL,
      key: DISCORD_ROLE_CONNECTION_KEYS.IS_ENGINEERING,
      name: 'Ressort Engineering',
      description: 'Mitglied der Authentik-Gruppe engineering',
    },
  ]

export type DiscordRoleConnectionMetadataValues = {
  [DISCORD_ROLE_CONNECTION_KEYS.IS_MEMBER]: string
  [DISCORD_ROLE_CONNECTION_KEYS.IS_VORSTAND]: string
  [DISCORD_ROLE_CONNECTION_KEYS.IS_EHRENMITGLIED]: string
  [DISCORD_ROLE_CONNECTION_KEYS.IS_ORGANISATION]: string
  [DISCORD_ROLE_CONNECTION_KEYS.IS_ENGINEERING]: string
}

function boolMeta(value: boolean): string {
  return value ? BOOL_TRUE : BOOL_FALSE
}

export function buildRoleConnectionMetadata(
  isMember: boolean,
  groupNames: string[],
): DiscordRoleConnectionMetadataValues {
  if (!isMember) {
    return {
      [DISCORD_ROLE_CONNECTION_KEYS.IS_MEMBER]: BOOL_FALSE,
      [DISCORD_ROLE_CONNECTION_KEYS.IS_VORSTAND]: BOOL_FALSE,
      [DISCORD_ROLE_CONNECTION_KEYS.IS_EHRENMITGLIED]: BOOL_FALSE,
      [DISCORD_ROLE_CONNECTION_KEYS.IS_ORGANISATION]: BOOL_FALSE,
      [DISCORD_ROLE_CONNECTION_KEYS.IS_ENGINEERING]: BOOL_FALSE,
    }
  }

  let isVorstand = false
  let isEhrenmitglied = false
  let isOrganisation = false
  let isEngineering = false

  for (const groupName of groupNames) {
    if (isVorstandProfileGroup(groupName)) {
      isVorstand = true
    }
    if (isHonorProfileGroup(groupName)) {
      isEhrenmitglied = true
    }
    const ressort = getProfileRessortGroup(groupName)
    if (ressort === PROFILE_RESSORT_GROUPS.organisation) {
      isOrganisation = true
    }
    if (ressort === PROFILE_RESSORT_GROUPS.engineering) {
      isEngineering = true
    }
  }

  return {
    [DISCORD_ROLE_CONNECTION_KEYS.IS_MEMBER]: boolMeta(true),
    [DISCORD_ROLE_CONNECTION_KEYS.IS_VORSTAND]: boolMeta(isVorstand),
    [DISCORD_ROLE_CONNECTION_KEYS.IS_EHRENMITGLIED]: boolMeta(isEhrenmitglied),
    [DISCORD_ROLE_CONNECTION_KEYS.IS_ORGANISATION]: boolMeta(isOrganisation),
    [DISCORD_ROLE_CONNECTION_KEYS.IS_ENGINEERING]: boolMeta(isEngineering),
  }
}

class DiscordLinkedRoleApiError extends Error {
  constructor(
    readonly status: number,
    message?: string,
  ) {
    super(message ?? `Discord Linked Role API error (${status})`)
    this.name = 'DiscordLinkedRoleApiError'
  }
}

async function readErrorMessage(
  response: Response,
): Promise<string | undefined> {
  try {
    const data = (await response.json()) as { message?: string; code?: number }
    if (!data.message) {
      return undefined
    }
    return data.code ? `${data.message} (code ${data.code})` : data.message
  } catch {
    return undefined
  }
}

let metadataRegisterPromise: Promise<void> | null = null

export async function registerDiscordRoleConnectionMetadata(): Promise<void> {
  const botToken = serverConfig.discord.botToken
  const applicationId = serverConfig.discord.clientId
  if (!botToken || !applicationId) {
    throw new Error(
      'Discord Linked Roles need DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID',
    )
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/applications/${applicationId}/role-connections/metadata`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(DISCORD_ROLE_CONNECTION_METADATA),
    },
  )

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new DiscordLinkedRoleApiError(
      response.status,
      message
        ? `Discord metadata register ${response.status}: ${message}`
        : undefined,
    )
  }
}

export async function ensureDiscordRoleConnectionMetadata(): Promise<void> {
  if (!serverConfig.discord.isLinkedRolesConfigured) {
    return
  }

  if (!metadataRegisterPromise) {
    metadataRegisterPromise = registerDiscordRoleConnectionMetadata().catch(
      error => {
        metadataRegisterPromise = null
        throw error
      },
    )
  }

  await metadataRegisterPromise
}

function clipPlatformUsername(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return 'mitglied'
  }
  return trimmed.slice(0, 100)
}

export async function writeUserDiscordRoleConnection(options: {
  accessToken: string
  platformUsername: string
  isMember: boolean
  groupNames: string[]
}): Promise<void> {
  const applicationId = serverConfig.discord.clientId
  if (!applicationId) {
    throw new Error('DISCORD_CLIENT_ID is not configured')
  }

  await ensureDiscordRoleConnectionMetadata()

  const response = await fetch(
    `${DISCORD_API_BASE}/users/@me/applications/${applicationId}/role-connection`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform_name: APP_NAME,
        platform_username: clipPlatformUsername(options.platformUsername),
        metadata: buildRoleConnectionMetadata(
          options.isMember,
          options.groupNames,
        ),
      }),
    },
  )

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new DiscordLinkedRoleApiError(
      response.status,
      message
        ? `Discord role connection ${response.status}: ${message}`
        : undefined,
    )
  }
}

export async function writeRoleConnectionForAuthentikUser(
  accessToken: string,
  authentikUser: AuthentikUserResponse,
): Promise<void> {
  const authentikUserId = getAuthentikApiUserId(authentikUser)
  const groupNames = await getAuthentikUserGroups(authentikUserId)
  await writeUserDiscordRoleConnection({
    accessToken,
    platformUsername: authentikUser.username || authentikUser.name,
    isMember: true,
    groupNames,
  })
}

export async function writeEmptyDiscordRoleConnection(
  accessToken: string,
  platformUsername: string,
): Promise<void> {
  await writeUserDiscordRoleConnection({
    accessToken,
    platformUsername,
    isMember: false,
    groupNames: [],
  })
}

export { DiscordLinkedRoleApiError }
