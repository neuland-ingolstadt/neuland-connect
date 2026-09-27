import { useCallback, useEffect, useRef, useState } from 'react'
import { QrCamera } from '#/components/scanner/qr-camera'
import { ScannerResult } from '#/components/scanner/scanner-result'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import {
  clearPublicKey,
  isPublicKeyAvailable,
  setPublicKey,
  verifyQRCode,
} from '#/lib/member-id/qr-verifier'
import type { VerificationResult } from '#/lib/member-id/types'
import { getMemberIdPublicKeyFn } from '#/server/get-member-id-public-key'

const RESCAN_COOLDOWN_MS = 2000

export function MemberIdScanner() {
  const [keyReady, setKeyReady] = useState(false)
  const [keyLoading, setKeyLoading] = useState(true)
  const [keyError, setKeyError] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [cooldown, setCooldown] = useState(false)
  const cooldownTimer = useRef<number | null>(null)

  const loadPublicKey = useCallback(async () => {
    setKeyLoading(true)
    setKeyError(false)
    try {
      const { publicKey } = await getMemberIdPublicKeyFn()
      setPublicKey(publicKey)
      setKeyReady(true)
    } catch (err) {
      console.error('[scanner] public key load failed', err)
      clearPublicKey()
      setKeyReady(false)
      setKeyError(true)
    } finally {
      setKeyLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPublicKey()
    return () => {
      clearPublicKey()
      if (cooldownTimer.current != null) {
        window.clearTimeout(cooldownTimer.current)
      }
    }
  }, [loadPublicKey])

  const startCooldown = useCallback(() => {
    setCooldown(true)
    if (cooldownTimer.current != null) {
      window.clearTimeout(cooldownTimer.current)
    }
    cooldownTimer.current = window.setTimeout(() => {
      setCooldown(false)
      cooldownTimer.current = null
    }, RESCAN_COOLDOWN_MS)
  }, [])

  const handleScan = useCallback(
    async (data: string) => {
      if (!isPublicKeyAvailable() || cooldown) return

      startCooldown()

      const verification = await verifyQRCode(data)
      setResult(verification)
    },
    [cooldown, startCooldown],
  )

  if (keyLoading) {
    return (
      <TerminalPanel title="Scanner">
        <div
          className="flex min-h-48 items-center justify-center p-6"
          aria-busy="true"
        >
          <p className="text-sm text-terminal-text/55">
            Prüfschlüssel wird geladen …
          </p>
        </div>
      </TerminalPanel>
    )
  }

  if (keyError || !keyReady) {
    return (
      <TerminalPanel title="Scanner">
        <div className="flex min-h-48 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            Der Prüfschlüssel konnte nicht geladen werden.
          </p>
          <Button type="button" variant="outline" onClick={loadPublicKey}>
            Erneut versuchen
          </Button>
        </div>
      </TerminalPanel>
    )
  }

  return (
    <div className="space-y-5">
      <TerminalPanel title="Scanner">
        <div className="p-4 sm:p-5">
          <QrCamera
            onScan={handleScan}
            paused={cooldown}
            status={result ? (result.success ? 'valid' : 'invalid') : null}
          />
        </div>
      </TerminalPanel>
      <ScannerResult result={result} />
    </div>
  )
}
