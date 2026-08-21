import { Check } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { INTEGRATION_CARD_IDS } from '#/components/dashboard/dashboard-action-banner'
import { IntegrationProgressInline } from '#/components/dashboard/integration-progress-inline'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { EXTERNAL_LINKS } from '#/lib/constants'
import type { NeulandNextMemberSession } from '#/lib/integrations/neuland-next/session'

const SETUP_STEPS = [
  { step: '01', title: 'Neuland Next installieren' },
  { step: '02', title: 'Neuland-Konto in den Einstellungen verbinden' },
  { step: '03', title: 'Mitgliedsausweis & exklusive Benefits nutzen' },
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
      title="Mitgliedsausweis"
      titleAside={
        <IntegrationProgressInline
          steps={[{ id: 'next-session', label: 'Next', complete: signedIn }]}
          isComplete={signedIn}
        />
      }
    >
      <div
        id={INTEGRATION_CARD_IDS.membership}
        className="space-y-4 p-4 scroll-mt-24"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card">
              <NeulandPalm className="size-5 text-terminal-text" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-terminal-lightGreen">
                Digitaler Neuland Mitgliedsausweis
              </p>
              <p className="mt-0.5 text-xs leading-snug text-terminal-text/50">
                {signedIn
                  ? 'Angemeldet. Mitgliedsfeatures in Neuland Next sind freigeschaltet.'
                  : 'In Neuland Next verfügbar.'}
              </p>
            </div>
          </div>
          {signedIn ? <Badge variant="success">Angemeldet</Badge> : null}
        </div>

        {signedIn ? (
          <ul className="space-y-2">
            {UNLOCKED_FEATURES.map(title => (
              <li key={title} className="flex items-center gap-3">
                <Check
                  className="size-3.5 shrink-0 text-terminal-cyan/80"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <p className="font-mono text-sm text-terminal-text">{title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <ol className="space-y-2">
              {SETUP_STEPS.map(item => (
                <li key={item.step} className="flex items-center gap-3">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-terminal-cyan/80">
                    {item.step}
                  </span>
                  <p className="font-mono text-sm text-terminal-text">
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
