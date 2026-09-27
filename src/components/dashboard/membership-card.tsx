import { Check } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { MembershipPassButton } from '#/components/dashboard/membership-pass-button'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { EXTERNAL_LINKS } from '#/lib/constants'
import { useI18n } from '#/lib/i18n/locale-context'
import type { MessageKey } from '#/lib/i18n/messages'
import { INTEGRATION_CARD_IDS } from '#/lib/integrations/connect-anchors'
import type { NeulandNextMemberSession } from '#/lib/integrations/neuland-next/session'

const SETUP_STEPS: { step: string; titleKey: MessageKey }[] = [
  { step: '1', titleKey: 'next.step.install' },
  { step: '2', titleKey: 'next.step.connect' },
  { step: '3', titleKey: 'next.step.use' },
] as const

const UNLOCKED_FEATURES: MessageKey[] = [
  'next.feature.pass',
  'next.feature.colors',
  'next.feature.icons',
] as const

type MembershipCardProps = {
  nextSession: NeulandNextMemberSession
}

export function MembershipCard({ nextSession }: MembershipCardProps) {
  const signedIn = nextSession.signedIn
  const { t } = useI18n()

  return (
    <TerminalPanel
      id={INTEGRATION_CARD_IDS.membership}
      className="scroll-mt-24"
      title={t('next.card.title')}
      titleAside={
        <IntegrationProgressInline
          steps={[{ id: 'next-session', label: 'Next', complete: signedIn }]}
          isComplete={signedIn}
        />
      }
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card/60">
              <NeulandPalm className="size-5 text-terminal-text" />
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold tracking-tight text-terminal-text">
                {t('next.card.name')}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-terminal-text/55">
                {signedIn
                  ? t('next.card.unlockedHint')
                  : t('next.card.setupHint')}
              </p>
            </div>
          </div>
          {signedIn ? (
            <Badge variant="success">{t('next.card.signedIn')}</Badge>
          ) : null}
        </div>

        {signedIn ? (
          <>
            <ul className="space-y-2">
              {UNLOCKED_FEATURES.map(titleKey => (
                <li key={titleKey} className="flex min-w-0 items-center gap-3">
                  <Check
                    className="size-3.5 shrink-0 text-terminal-green"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <p className="min-w-0 break-words text-sm text-terminal-text">
                    {t(titleKey)}
                  </p>
                </li>
              ))}
            </ul>
            <div>
              <MembershipPassButton variant="outline" />
            </div>
          </>
        ) : (
          <>
            <ol className="space-y-2">
              {SETUP_STEPS.map(item => (
                <li key={item.step} className="flex min-w-0 items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center border border-terminal-green/30 bg-terminal-green/10 text-[11px] font-semibold tabular-nums text-terminal-green">
                    {item.step}
                  </span>
                  <p className="min-w-0 break-words text-sm text-terminal-text">
                    {t(item.titleKey)}
                  </p>
                </li>
              ))}
            </ol>
            <div>
              <Button variant="outline" asChild>
                <a
                  href={EXTERNAL_LINKS.NEULAND_NEXT_GET}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('next.card.download')}
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </TerminalPanel>
  )
}
