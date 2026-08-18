import { createPublicKey, verify } from 'node:crypto'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

export function normalizeDiscordPublicKey(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

export function verifyDiscordInteractionRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  publicKeyHex: string,
): boolean {
  if (!signature || !timestamp) {
    return false
  }

  const normalizedKey = normalizeDiscordPublicKey(publicKeyHex)
  if (!/^[0-9a-fA-F]{64}$/.test(normalizedKey)) {
    return false
  }

  try {
    const publicKey = createPublicKey({
      key: Buffer.concat([
        ED25519_SPKI_PREFIX,
        Buffer.from(normalizedKey, 'hex'),
      ]),
      format: 'der',
      type: 'spki',
    })

    return verify(
      null,
      Buffer.from(timestamp + rawBody),
      publicKey,
      Buffer.from(signature, 'hex'),
    )
  } catch {
    return false
  }
}
