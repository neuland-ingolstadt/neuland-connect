import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { ThemeToggle } from '#/components/layout/theme-toggle'
import { Button } from '#/components/ui/button'
import { ROUTES } from '#/lib/constants'

type AppHeaderProps = {
  userName?: string
  showDashboardLink?: boolean
}

export function AppHeader({
  userName,
  showDashboardLink = true,
}: AppHeaderProps) {
  const logo = (
    <>
      <NeulandPalm className="neuland-nav-logo h-9 w-auto" />
      <div className="font-mono leading-tight">
        <span className="block text-sm font-semibold tracking-wide text-terminal-text">
          Neuland
        </span>
        <span className="block text-[10px] uppercase tracking-[0.25em] text-terminal-text/50">
          Connect
        </span>
      </div>
    </>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-terminal-window-border bg-terminal-nav shadow-[0_1px_0_0_rgba(74,222,128,0.06)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {showDashboardLink ? (
          <Link
            to={ROUTES.DASHBOARD}
            search={{
              integration: undefined,
              status: undefined,
              message: undefined,
            }}
            className="group flex items-center gap-3 no-underline"
          >
            {logo}
          </Link>
        ) : (
          <div className="group flex items-center gap-3">{logo}</div>
        )}

        <div className="flex items-center gap-3">
          {userName ? (
            <span className="hidden font-mono text-xs text-terminal-text/60 sm:inline">
              {userName}
            </span>
          ) : null}

          <ThemeToggle />

          {userName ? (
            <Button variant="outline" size="sm" asChild>
              <a href={ROUTES.AUTH_LOGOUT}>
                <LogOut />
                Abmelden
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
