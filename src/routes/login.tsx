import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import {
  APP_NAME,
  isLoginStartFlag,
  LOGIN_SEARCH_DEFAULTS,
  ROUTES,
} from '#/lib/constants'
import { hasActiveSessionFn } from '#/server/get-current-user'
import { getOidcAuthorizeUrlFn } from '#/server/oidc-login'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === 'string' ? search.error : undefined,
    start: isLoginStartFlag(search.start) ? true : undefined,
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
  pendingComponent: LoginPending,
  component: LoginPage,
})

function LoginPending() {
  return (
    <LoginShell>
      <LoginAuthBody isWorking />
    </LoginShell>
  )
}

function LoginPage() {
  const { error, start } = Route.useSearch()
  const navigate = useNavigate()
  const [isWorking, setIsWorking] = useState(() => Boolean(start))
  const requestId = useRef(0)

  const beginAuthentik = useCallback(async () => {
    const id = ++requestId.current
    setIsWorking(true)

    try {
      const authorizeUrl = await getOidcAuthorizeUrlFn()
      if (id !== requestId.current) {
        return
      }

      window.location.assign(authorizeUrl)
    } catch {
      if (id !== requestId.current) {
        return
      }

      setIsWorking(false)
      await navigate({
        to: ROUTES.LOGIN,
        search: { ...LOGIN_SEARCH_DEFAULTS, error: 'login_failed' },
        replace: true,
      })
    }
  }, [navigate])

  useEffect(() => {
    if (!start) {
      return
    }

    void navigate({
      to: ROUTES.LOGIN,
      search: LOGIN_SEARCH_DEFAULTS,
      replace: true,
    })
    void beginAuthentik()
  }, [beginAuthentik, navigate, start])

  return (
    <LoginShell>
      <LoginAuthBody
        error={error}
        isWorking={isWorking}
        onStart={() => {
          void beginAuthentik()
        }}
      />
    </LoginShell>
  )
}

function LoginShell({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <AppHeader showDashboardLink={false} />

      <div className="flex flex-1 items-center justify-center p-4">
        <TerminalPanel title="Authentifizierung" className="w-full max-w-md">
          {children}
        </TerminalPanel>
      </div>

      <LegalFooter />
    </PageShell>
  )
}

function LoginAuthBody({
  error,
  isWorking = false,
  onStart,
}: {
  error?: string
  isWorking?: boolean
  onStart?: () => void
}) {
  return (
    <div className="space-y-6 p-6 text-center">
      <div className="mx-auto flex justify-center">
        <NeulandPalm className="h-14 w-auto text-terminal-text" />
      </div>

      <div>
        <h1 className="font-mono text-xl font-semibold text-terminal-lightGreen">
          {APP_NAME}
        </h1>
        {isWorking ? (
          <p className="mt-2 text-sm leading-relaxed text-terminal-text/65">
            Authentik wird vorbereitet. Du wirst gleich weitergeleitet.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-terminal-text/65">
            Melde dich mit deinem Neuland-Konto an, um zum Mitgliederportal zu
            gelangen.
          </p>
        )}
      </div>

      {error && !isWorking ? (
        <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-left text-sm text-destructive-foreground">
          Anmeldung fehlgeschlagen. Bitte versuche es erneut.
        </div>
      ) : null}

      {isWorking ? (
        <div
          className="flex flex-col items-center gap-3 py-2"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 animate-spin text-terminal-cyan" />
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-terminal-text/55">
            Warte auf Authentik
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          type="button"
          onClick={onStart}
        >
          <LogIn />
          Mit Authentik anmelden
        </Button>
      )}
    </div>
  )
}
