import { createFileRoute, redirect } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { hasActiveSessionFn } from '#/server/get-current-user'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  beforeLoad: async () => {
    const hasSession = await hasActiveSessionFn()
    if (hasSession) {
      throw redirect({
        to: ROUTES.DASHBOARD,
        search: {
          integration: undefined,
          status: undefined,
          message: undefined,
          intro: undefined,
        },
      })
    }
    return { user: null }
  },
  component: LoginPage,
})

function LoginPage() {
  const { error } = Route.useSearch()

  return (
    <PageShell>
      <AppHeader showDashboardLink={false} />

      <div className="flex flex-1 items-center justify-center p-4">
        <TerminalPanel title="Authentifizierung" className="w-full max-w-md">
          <div className="space-y-6 p-6 text-center">
            <div className="mx-auto flex justify-center">
              <NeulandPalm className="h-14 w-auto text-terminal-text" />
            </div>

            <div>
              <h1 className="font-mono text-xl font-semibold text-terminal-lightGreen">
                {APP_NAME}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-terminal-text/65">
                Melde dich mit deinem Neuland-Konto an, um zum Mitgliederportal
                zu gelangen.
              </p>
            </div>

            {error ? (
              <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-left text-sm text-destructive-foreground">
                Anmeldung fehlgeschlagen. Bitte versuche es erneut.
              </div>
            ) : null}

            <Button variant="outline" className="w-full" size="lg" asChild>
              <a href={ROUTES.AUTH_LOGIN}>
                <LogIn />
                Mit Authentik anmelden
              </a>
            </Button>
          </div>
        </TerminalPanel>
      </div>

      <LegalFooter />
    </PageShell>
  )
}
