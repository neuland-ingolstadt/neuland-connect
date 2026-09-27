import { CheckCircle2, ScanLine, ShieldX } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { useI18n } from '#/lib/i18n/locale-context'
import type { Locale } from '#/lib/i18n/messages'
import { localeToDateLocale, translate } from '#/lib/i18n/messages'
import { QRType, type VerificationResult } from '#/lib/member-id/types'
import { cn } from '#/lib/utils'

type ScannerResultProps = {
  result: VerificationResult | null
}

function formatTimestamp(seconds: number, locale: Locale): string {
  return new Date(seconds * 1000).toLocaleString(localeToDateLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function qrTypeLabel(type: QRType, locale: Locale): string {
  switch (type) {
    case QRType.APP:
      return translate(locale, 'scanner.typeApp')
    case QRType.APPLE_WALLET:
      return translate(locale, 'scanner.typeApple')
    case QRType.ANDROID_WALLET:
      return translate(locale, 'scanner.typeAndroid')
    default:
      return translate(locale, 'scanner.typeDefault')
  }
}

function verifyErrorMessage(
  error: string | undefined,
  t: (key: Parameters<typeof translate>[1]) => string,
): string {
  if (!error) return t('scanner.errorGeneric')
  if (error === 'public_key_unavailable') {
    return t('scanner.errorKeyUnavailable')
  }
  if (error === 'invalid_signature') {
    return t('scanner.errorInvalidSignatureLead')
  }
  if (error === 'expired') {
    return t('scanner.errorExpiredLead')
  }
  return error
}

export function ScannerResult({ result }: ScannerResultProps) {
  const { t, locale } = useI18n()
  if (!result) {
    return (
      <TerminalPanel title={t('scanner.resultPanel')}>
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="border border-terminal-window-border bg-terminal-card/50 p-2 text-terminal-text/50">
            <ScanLine className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              {t('scanner.ready')}
            </h2>
            <p className="text-sm leading-relaxed text-terminal-text/55">
              {t('scanner.readyHint')}
            </p>
          </div>
        </div>
      </TerminalPanel>
    )
  }

  const success = result.success

  return (
    <TerminalPanel title={t('scanner.resultPanel')}>
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
                {success ? t('scanner.validTitle') : t('scanner.invalidTitle')}
              </h2>
              {!success ? (
                <p className="text-sm leading-relaxed text-terminal-text/55">
                  {verifyErrorMessage(result.error, t)}
                </p>
              ) : null}
            </div>
          </div>
          <Badge variant={success ? 'success' : 'destructive'}>
            {success ? t('scanner.badgeValid') : t('scanner.badgeInvalid')}
          </Badge>
        </div>

        {result.payload ? (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label={t('scanner.fieldName')} value={result.payload.name} />
            <Field
              label={t('scanner.fieldType')}
              value={qrTypeLabel(result.payload.type, locale)}
            />
            <Field
              label={t('scanner.fieldIssued')}
              value={formatTimestamp(result.payload.iat, locale)}
            />
            <Field
              label={t('scanner.fieldExpires')}
              value={formatTimestamp(result.payload.exp, locale)}
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
