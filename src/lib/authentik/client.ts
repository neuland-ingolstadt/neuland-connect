import type {
  AuthentikUserListResponse,
  AuthentikUserResponse,
  ResolveAuthentikUserInput,
} from '#/lib/authentik/types'
import { serverConfig } from '#/lib/config'
import { AUTHENTIK_ATTRIBUTES } from '#/lib/constants'
import { getAuthentikErrorMessage } from '#/lib/errors'

class AuthentikApiError extends Error {
  constructor(
    readonly status: number,
    message?: string,
  ) {
    super(message ?? getAuthentikErrorMessage(status))
    this.name = 'AuthentikApiError'
  }
}

async function authentikFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${serverConfig.authentik.apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serverConfig.authentik.apiToken}`,
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new AuthentikApiError(response.status)
  }

  return response.json() as Promise<T>
}

function encodeUserId(userId: string | number): string {
  return encodeURIComponent(String(userId))
}

export function getAuthentikApiUserId(user: AuthentikUserResponse): string {
  return String(user.pk)
}

async function listAuthentikUsers(
  query: Record<string, string>,
): Promise<AuthentikUserListResponse> {
  const params = new URLSearchParams(query)
  return authentikFetch<AuthentikUserListResponse>(
    `/api/v3/core/users/?${params.toString()}`,
  )
}

export async function getAuthentikUser(
  userId: string | number,
): Promise<AuthentikUserResponse> {
  return authentikFetch<AuthentikUserResponse>(
    `/api/v3/core/users/${encodeUserId(userId)}/`,
  )
}

export async function resolveAuthentikUser(
  input: ResolveAuthentikUserInput,
): Promise<AuthentikUserResponse> {
  try {
    return await getAuthentikUser(input.sub)
  } catch (error) {
    if (!(error instanceof AuthentikApiError) || error.status !== 404) {
      throw error
    }
  }

  if (input.email) {
    const byEmail = await listAuthentikUsers({ email: input.email })
    const user = byEmail.results[0]
    if (user) {
      return user
    }
  }

  if (input.username) {
    const byUsername = await listAuthentikUsers({ username: input.username })
    const user = byUsername.results[0]
    if (user) {
      return user
    }
  }

  if (input.email) {
    const bySearch = await listAuthentikUsers({ search: input.email })
    const user = bySearch.results[0]
    if (user) {
      return user
    }
  }

  throw new AuthentikApiError(
    404,
    `Benutzer konnte in Authentik nicht gefunden werden (sub: "${input.sub}"). ` +
      'Bitte wende dich an den Administrator.',
  )
}

export async function updateAuthentikUserAttributes(
  userId: string | number,
  attributes: Record<string, string>,
): Promise<AuthentikUserResponse> {
  const currentUser = await getAuthentikUser(userId)

  return authentikFetch<AuthentikUserResponse>(
    `/api/v3/core/users/${encodeUserId(userId)}/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attributes: {
          ...currentUser.attributes,
          ...attributes,
        },
      }),
    },
  )
}

export async function patchAuthentikUserAttributes(
  userId: string | number,
  options: {
    set?: Record<string, string>
    remove?: string[]
  },
): Promise<AuthentikUserResponse> {
  const currentUser = await getAuthentikUser(userId)
  const attributes = { ...currentUser.attributes }

  for (const key of options.remove ?? []) {
    delete attributes[key]
  }

  if (options.set) {
    Object.assign(attributes, options.set)
  }

  return authentikFetch<AuthentikUserResponse>(
    `/api/v3/core/users/${encodeUserId(userId)}/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes }),
    },
  )
}

export async function listAllAuthentikUsers(): Promise<
  AuthentikUserResponse[]
> {
  const users: AuthentikUserResponse[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const response = await listAuthentikUsers({
      page: String(page),
      page_size: String(pageSize),
    })
    users.push(...response.results)

    if (response.results.length < pageSize) {
      break
    }

    page += 1
  }

  return users
}

export async function clearGitHubUserAttributes(
  userId: string | number,
): Promise<AuthentikUserResponse> {
  const currentUser = await getAuthentikUser(userId)
  const attributes = { ...currentUser.attributes }

  delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_USERNAME]
  delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ID]
  delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_CONNECTED_AT]
  delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_STATUS]
  delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_INVITED_AT]
  delete attributes[AUTHENTIK_ATTRIBUTES.GITHUB_ORG_LAST_ERROR]

  return authentikFetch<AuthentikUserResponse>(
    `/api/v3/core/users/${encodeUserId(userId)}/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes }),
    },
  )
}

export { AuthentikApiError }
