import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { AlertTriangle, ChevronDown, LogIn, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { ROUTES } from '#/lib/constants'
import { parseAppError } from '#/lib/errors'
import { cn } from '#/lib/utils'

export function AppErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)
  const details = parseAppError(error)

  function handleRetry() {
    reset()
    void router.invalidate()
  }

  return (
    <PageShell>
      <AppHeader showDashboardLink={false} />

      <div className="flex flex-1 items-center justify-center p-4">
        <TerminalPanel title="Systemstatus" className="w-full max-w-md">
          <div className="space-y-6 p-6 text-center">
            <div className="mx-auto flex justify-center">
              <div className="relative">
                <NeulandPalm className="h-14 w-auto text-terminal-cyan/70" />
                <AlertTriangle className="absolute -right-1 -bottom-1 h-5 w-5 text-terminal-highlight" />
              </div>
            </div>

            <div>
              <h1 className="font-mono text-xl font-semibold text-terminal-lightGreen">
                {details.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-terminal-text/65">
                {details.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {details.isRetryable ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                  onClick={handleRetry}
                >
                  <RefreshCw />
                  Erneut versuchen
                </Button>
              ) : null}

              {details.showLoginLink ? (
                <Button
                  className="w-full sm:w-auto"
                  size="lg"
                  variant="outline"
                  asChild
                >
                  <Link to={ROUTES.LOGIN} search={{ error: undefined }}>
                    <LogIn />
                    Zur Anmeldung
                  </Link>
                </Button>
              ) : null}
            </div>

            {import.meta.env.DEV ? (
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => setShowDetails(current => !current)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-terminal-text/45 transition-colors hover:text-terminal-text/70"
                >
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      showDetails && 'rotate-180',
                    )}
                  />
                  Technische Details
                </button>

                {showDetails ? (
                  <pre className="mt-3 overflow-x-auto border border-terminal-window-border bg-terminal-bg/60 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-terminal-text/55">
                    {details.technicalMessage}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        </TerminalPanel>
      </div>

      <LegalFooter />
    </PageShell>
  )
}
