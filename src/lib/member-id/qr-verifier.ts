import { decode as cborDecode } from 'cborg'
import { inflate } from 'pako'
import { decodeBase45 } from '#/lib/member-id/base45'
import {
  type QRPayload,
  QRType,
  type VerificationResult,
} from '#/lib/member-id/types'

let cachedPublicKey: string | null = null

export function setPublicKey(hex: string): void {
  const trimmed = hex.trim()
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
    throw new Error('Invalid public key format')
  }
  cachedPublicKey = trimmed
}

export function clearPublicKey(): void {
  cachedPublicKey = null
}

export function isPublicKeyAvailable(): boolean {
  return cachedPublicKey !== null
}

export async function verifyQRCode(
  qrString: string,
): Promise<VerificationResult> {
  if (!cachedPublicKey) {
    return {
      success: false,
      payload: null,
      error: 'public_key_unavailable',
    }
  }

  try {
    if (
      !qrString ||
      typeof qrString !== 'string' ||
      qrString.trim().length === 0
    ) {
      throw new Error('Invalid Member ID: empty string')
    }

    const cleanQrString = qrString.trim()
    if (cleanQrString.length < 10) {
      throw new Error('Invalid Member ID: string too short')
    }

    const base45Decoded = decodeBase45(cleanQrString)
    if (!base45Decoded || base45Decoded.length === 0) {
      throw new Error('Base45 decoding failed')
    }

    const decompressed = zlibDecompress(base45Decoded)
    if (decompressed.length < 64) {
      throw new Error('Data too short to contain signature')
    }

    const cborData = decompressed.slice(0, -64)
    const signatureBytes = decompressed.slice(-64)
    const payload = parseCBOR(cborData)
    const signatureValid = await verifySignature(cborData, signatureBytes)
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < now

    return {
      success: signatureValid && !isExpired,
      payload,
      error: !signatureValid
        ? 'invalid_signature'
        : isExpired
          ? 'expired'
          : undefined,
    }
  } catch (error) {
    return {
      success: false,
      payload: null,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during QR verification',
    }
  }
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${clean.length}`)
  }

  const arr = new Uint8Array(clean.length / 2)
  for (let i = 0; i < arr.length; i++) {
    const hexPair = clean.slice(i * 2, i * 2 + 2)
    const byte = Number.parseInt(hexPair, 16)
    if (Number.isNaN(byte)) {
      throw new Error(`Invalid hex characters at position ${i * 2}`)
    }
    arr[i] = byte
  }
  return arr
}

function zlibDecompress(data: Uint8Array): Uint8Array {
  try {
    const result = inflate(data)
    if (!result || result.length === 0) {
      throw new Error('Decompression resulted in empty data')
    }
    return result
  } catch (error) {
    throw new Error(
      `Zlib decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

async function verifySignature(
  data: Uint8Array,
  signature: Uint8Array,
): Promise<boolean> {
  if (signature.length !== 64 || !cachedPublicKey) return false

  const keyBytes = hexToBytes(cachedPublicKey)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(keyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  )

  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new Uint8Array(signature),
    new Uint8Array(data),
  )
}

function parseCBOR(data: Uint8Array): QRPayload {
  const decoded = cborDecode(data)
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid CBOR payload')
  }

  const decodedObj = decoded as Record<string, unknown>
  const { sub, name, iat, exp, t } = decodedObj

  if (!sub || typeof sub !== 'string') {
    throw new Error("Missing or invalid 'sub' field")
  }
  if (!name || typeof name !== 'string') {
    throw new Error("Missing or invalid 'name' field")
  }
  if (typeof iat !== 'number') {
    throw new Error("Missing or invalid 'iat' field")
  }
  if (typeof exp !== 'number') {
    throw new Error("Missing or invalid 'exp' field")
  }
  if (!t || typeof t !== 'string') {
    throw new Error("Missing or invalid 't' field")
  }

  let type: QRType
  switch (t) {
    case 'a':
      type = QRType.APP
      break
    case 'wi':
      type = QRType.APPLE_WALLET
      break
    case 'wa':
      type = QRType.ANDROID_WALLET
      break
    default:
      throw new Error(`Invalid type code: ${t}`)
  }

  return { sub, name, iat, exp, type }
}
