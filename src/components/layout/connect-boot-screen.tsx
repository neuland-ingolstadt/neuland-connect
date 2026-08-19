import { NeulandPalm } from '#/components/brand/neuland-palm'
import { PageShell } from '#/components/layout/page-shell'
import { APP_NAME } from '#/lib/constants'

const BOOT_LINES = [
  { prompt: 'sitzung', detail: 'bestätigt' },
  { prompt: 'authentik', detail: 'verbinden' },
  { prompt: 'profil', detail: 'laden' },
] as const

export function ConnectBootScreen() {
  return (
    <PageShell>
      <main
        className="flex flex-1 items-center justify-center px-4 py-10"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="relative w-full max-w-md overflow-hidden border border-terminal-window-border bg-terminal-window">
          <span className="connect-boot-corner connect-boot-corner--tl" />
          <span className="connect-boot-corner connect-boot-corner--tr" />
          <span className="connect-boot-corner connect-boot-corner--bl" />
          <span className="connect-boot-corner connect-boot-corner--br" />
          <div className="connect-boot-scan pointer-events-none absolute inset-0" />

          <div className="relative border-b border-terminal-window-border/70 bg-terminal-window-title/80 px-4 py-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terminal-text/65">
              <span className="text-terminal-cyan/75">//</span> systemstart
            </p>
          </div>

          <div className="relative space-y-6 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="connect-boot-palm-wrap">
                <NeulandPalm className="h-16 w-auto text-terminal-text" />
              </div>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.28em] text-terminal-lightGreen">
                {APP_NAME}
              </p>
              <p className="mt-2 text-sm text-terminal-text/60">
                Dein Profil wird vorbereitet.
              </p>
            </div>

            <ol className="space-y-1.5 font-mono text-[12px] leading-relaxed">
              {BOOT_LINES.map((line, index) => (
                <li
                  key={line.prompt}
                  className="connect-boot-line flex items-baseline gap-2 text-terminal-text/55"
                  style={{ animationDelay: `${180 + index * 280}ms` }}
                >
                  <span className="text-terminal-cyan/80">$</span>
                  <span className="text-terminal-text/40">{line.prompt}</span>
                  <span className="text-terminal-text/25">·</span>
                  <span>{line.detail}</span>
                </li>
              ))}
              <li
                className="connect-boot-line flex items-center gap-2 pt-1 text-terminal-lightGreen"
                style={{ animationDelay: '1020ms' }}
              >
                <span className="text-terminal-cyan/80">$</span>
                <span>warte auf authentik</span>
                <span className="connect-boot-cursor" aria-hidden="true" />
              </li>
            </ol>

            <div className="connect-boot-track" aria-hidden="true">
              <div className="connect-boot-bar" />
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  )
}
