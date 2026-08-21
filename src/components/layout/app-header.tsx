import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { ThemeToggle } from '#/components/layout/theme-toggle'
import { Button } from '#/components/ui/button'
import { ROUTES } from '#/lib/constants'
import { cn } from '#/lib/utils'

type AppHeaderProps = {
  isSignedIn?: boolean
  showDashboardLink?: boolean
}

const dashboardSearch = {
  integration: undefined,
  status: undefined,
  message: undefined,
  intro: undefined,
} as const

export function AppHeader({
  isSignedIn = false,
  showDashboardLink = true,
}: AppHeaderProps) {
  const logo = (
    <>
      <NeulandPalm className="h-9 w-auto text-terminal-text" />
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
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6 sm:gap-8">
          {showDashboardLink ? (
            <Link
              to={ROUTES.DASHBOARD}
              search={dashboardSearch}
              className="group flex shrink-0 items-center gap-3 no-underline"
            >
              {logo}
            </Link>
          ) : (
            <div className="group flex shrink-0 items-center gap-3">{logo}</div>
          )}

          <nav
            aria-label="Hauptnavigation"
            className="flex items-center gap-1 sm:gap-2"
          >
            {showDashboardLink ? (
              <HeaderNavLink
                to={ROUTES.DASHBOARD}
                search={dashboardSearch}
                activeOptions={{ exact: true }}
              >
                Dashboard
              </HeaderNavLink>
            ) : null}
            <HeaderNavLink to={ROUTES.FAQ}>FAQ</HeaderNavLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {isSignedIn ? (
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

function HeaderNavLink({
  to,
  children,
  search,
  activeOptions,
}: {
  to: typeof ROUTES.DASHBOARD | typeof ROUTES.FAQ
  children: string
  search?: typeof dashboardSearch
  activeOptions?: { exact: boolean }
}) {
  return (
    <Link
      to={to}
      search={search}
      activeOptions={activeOptions}
      className={cn(
        'px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-terminal-text/50 no-underline transition-colors',
        'hover:text-terminal-text',
      )}
      activeProps={{
        className: 'text-terminal-lightGreen',
      }}
    >
      {children}
    </Link>
  )
}
