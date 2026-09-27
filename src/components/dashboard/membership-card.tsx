import { Check } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { MembershipPassButton } from '#/components/dashboard/membership-pass-button'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { EXTERNAL_LINKS } from '#/lib/constants'
import { INTEGRATION_CARD_IDS } from '#/lib/integrations/connect-anchors'
import type { NeulandNextMemberSession } from '#/lib/integrations/neuland-next/session'

const SETUP_STEPS = [
  { step: '1', title: 'Neuland Next installieren' },
  { step: '2', title: 'Neuland-Konto in den Einstellungen verbinden' },
  { step: '3', title: 'Mitgliedsausweis & exklusive Benefits nutzen' },
] as const

const UNLOCKED_FEATURES = [
  'Mitgliedsausweis verfügbar',
  'Akzentfarben freigeschaltet',
  'Exklusive App-Icons verfügbar',
] as const

type MembershipCardProps = {
  nextSession: NeulandNextMemberSession
}

export function MembershipCard({ nextSession }: MembershipCardProps) {
  const signedIn = nextSession.signedIn

  return (
    <TerminalPanel
      id={INTEGRATION_CARD_IDS.membership}
      className="scroll-mt-24"
      title="Mitgliedsausweis"
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
                Digitaler Mitgliedsausweis
              </p>
              <p className="mt-0.5 text-xs leading-snug text-terminal-text/55">
                {signedIn
                  ? 'Mitgliedsfeatures in Neuland Next sind freigeschaltet.'
                  : 'In Neuland Next verfügbar.'}
              </p>
            </div>
          </div>
          {signedIn ? <Badge variant="success">Angemeldet</Badge> : null}
        </div>

        {signedIn ? (
          <>
            <ul className="space-y-2">
              {UNLOCKED_FEATURES.map(title => (
                <li key={title} className="flex min-w-0 items-center gap-3">
                  <Check
                    className="size-3.5 shrink-0 text-terminal-green"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <p className="min-w-0 break-words text-sm text-terminal-text">
                    {title}
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
                    {item.title}
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
                  Neuland Next herunterladen
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </TerminalPanel>
  )
}
