import { createServerFn } from '@tanstack/react-start'
import { serverConfig } from '#/lib/config'

/**
 * Public key for verifying Member-ID QR signatures. Fetched from the
 * Member-ID service (`MEMBER_ID_API_BASE`) so the key never ships in the
 * client bundle. Deliberately public (no session required): it is a public
 * key, and the scanner page is usable without login.
 */
export const getMemberIdPublicKeyFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ publicKey: string }> => {
    const base = serverConfig.memberId.apiBase.replace(/\/$/, '')
    if (!base) {
      throw new Error('member_id_api_missing')
    }

    const res = await fetch(`${base}/api/public-key`, {
      method: 'GET',
      headers: { Accept: 'text/plain' },
    })

    if (!res.ok) {
      throw new Error(`member_id_public_key_failed:${res.status}`)
    }

    const publicKey = (await res.text()).trim()
    if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
      throw new Error('member_id_public_key_invalid')
    }

    return { publicKey }
  },
)
