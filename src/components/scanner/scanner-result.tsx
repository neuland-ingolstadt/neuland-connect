import { CheckCircle2, ScanLine, ShieldX } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { QRType, type VerificationResult } from '#/lib/member-id/types'
import { cn } from '#/lib/utils'

type ScannerResultProps = {
  result: VerificationResult | null
}

function formatTimestamp(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function qrTypeLabel(type: QRType): string {
  switch (type) {
    case QRType.APP:
      return 'Neuland Next'
    case QRType.APPLE_WALLET:
      return 'Apple Wallet'
    case QRType.ANDROID_WALLET:
      return 'Android Wallet'
    default:
      return 'Mitgliedsausweis'
  }
}

function verifyErrorMessage(error?: string): string {
  if (!error) return 'Der Code konnte nicht geprüft werden.'
  if (error === 'public_key_unavailable') {
    return 'Prüfschlüssel nicht verfügbar. Bitte Seite neu laden.'
  }
  if (error === 'invalid_signature') {
    return 'Die Signatur ist ungültig. Kein gültiger Mitgliedsausweis.'
  }
  if (error === 'expired') {
    return 'Der Ausweis ist abgelaufen.'
  }
  return error
}

export function ScannerResult({ result }: ScannerResultProps) {
  if (!result) {
    return (
      <TerminalPanel title="Ergebnis">
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="border border-terminal-window-border bg-terminal-card/50 p-2 text-terminal-text/50">
            <ScanLine className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              Bereit zum Scannen
            </h2>
            <p className="text-sm leading-relaxed text-terminal-text/55">
              Halte einen Mitgliedsausweis vor die Kamera. Das Ergebnis
              erscheint hier.
            </p>
          </div>
        </div>
      </TerminalPanel>
    )
  }

  const success = result.success

  return (
    <TerminalPanel title="Ergebnis">
      <div className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                'border p-2',
                success
                  ? 'border-terminal-green/40 bg-terminal-green/10 text-terminal-green'
                  : 'border-destructive/40 bg-destructive/10 text-destructive',
              )}
            >
              {success ? (
                <CheckCircle2 className="size-5" aria-hidden />
              ) : (
                <ShieldX className="size-5" aria-hidden />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-semibold tracking-tight">
                {success ? 'Gültiger Mitgliedsausweis' : 'Ungültiger Code'}
              </h2>
              {!success ? (
                <p className="text-sm leading-relaxed text-terminal-text/55">
                  {verifyErrorMessage(result.error)}
                </p>
              ) : null}
            </div>
          </div>
          <Badge variant={success ? 'success' : 'destructive'}>
            {success ? 'Gültig' : 'Ungültig'}
          </Badge>
        </div>

        {result.payload ? (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="Name" value={result.payload.name} />
            <Field
              label="Ausweis-Typ"
              value={qrTypeLabel(result.payload.type)}
            />
            <Field
              label="Ausgestellt"
              value={formatTimestamp(result.payload.iat)}
            />
            <Field
              label="Gültig bis"
              value={formatTimestamp(result.payload.exp)}
            />
          </dl>
        ) : null}
      </div>
    </TerminalPanel>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="meta-label">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-terminal-text">{value}</dd>
    </div>
  )
}
