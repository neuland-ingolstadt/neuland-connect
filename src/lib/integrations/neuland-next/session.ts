export type NeulandNextMemberSession = {
  signedIn: boolean
  expiresAt: string | null
}

function isActiveRefreshToken(
  expires: string | null | undefined,
  revoked: boolean | undefined,
  now: number,
): boolean {
  if (revoked) {
    return false
  }

  if (!expires) {
    return true
  }

  const expiry = Date.parse(expires)
  if (Number.isNaN(expiry)) {
    return false
  }

  return expiry > now
}

export async function getNeulandNextMemberSession(
  userId: string | number,
): Promise<NeulandNextMemberSession> {
  const { listNeulandNextRefreshTokensForUser } = await import(
    '#/lib/authentik/client'
  )

  const tokens = await listNeulandNextRefreshTokensForUser(userId)
  const now = Date.now()
  const active = tokens.filter(token =>
    isActiveRefreshToken(token.expires, token.revoked, now),
  )

  if (active.length === 0) {
    return { signedIn: false, expiresAt: null }
  }

  let latestExpiry: string | null = null
  let latestMs = 0

  for (const token of active) {
    if (!token.expires) {
      continue
    }

    const ms = Date.parse(token.expires)
    if (!Number.isNaN(ms) && ms >= latestMs) {
      latestMs = ms
      latestExpiry = token.expires
    }
  }

  return { signedIn: true, expiresAt: latestExpiry }
}
