import { NeulandPalm } from '#/components/brand/neuland-palm'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { EXTERNAL_LINKS } from '#/lib/constants'

const SETUP_STEPS = [
  { step: '01', title: 'Neuland Next installieren' },
  { step: '02', title: 'Neuland-Konto in den Einstellungen verbinden' },
  { step: '03', title: 'Mitgliedsausweis & exklusive App-Features nutzen' },
] as const

export function MembershipCard() {
  return (
    <TerminalPanel title="Mitgliedsausweis">
      <div className="space-y-5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-card">
            <NeulandPalm className="size-5 text-terminal-text" />
          </div>
          <div>
            <p className="font-mono text-sm font-semibold text-terminal-lightGreen">
              Digitaler Neuland Mitgliedsausweis
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-terminal-text/50">
              In der Neuland Next App verfügbar!
            </p>
          </div>
        </div>

        <ol className="space-y-2 border-t border-terminal-window-border pt-4">
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

        <div className="border-t border-terminal-window-border pt-4">
          <Button asChild>
            <a
              href={EXTERNAL_LINKS.NEULAND_NEXT_GET}
              target="_blank"
              rel="noopener noreferrer"
            >
              Neuland Next herunterladen
            </a>
          </Button>
        </div>
      </div>
    </TerminalPanel>
  )
}
