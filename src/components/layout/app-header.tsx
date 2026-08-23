import { Link } from '@tanstack/react-router'
import { LogOut, Menu } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { ThemeToggle } from '#/components/layout/theme-toggle'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { KONTEN_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { cn } from '#/lib/utils'

type AppHeaderProps = {
  isSignedIn?: boolean
  showDashboardLink?: boolean
}

type AppNavTo =
  | typeof ROUTES.DASHBOARD
  | typeof ROUTES.CONNECT
  | typeof ROUTES.RESSOURCEN
  | typeof ROUTES.FAQ

const dashboardSearch = KONTEN_SEARCH_DEFAULTS

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
    <header className="sticky top-0 z-50 border-b border-terminal-window-border bg-terminal-nav/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
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
            className="hidden items-center gap-2 md:flex"
          >
            {showDashboardLink ? (
              <>
                <HeaderNavLink
                  to={ROUTES.DASHBOARD}
                  search={dashboardSearch}
                  activeOptions={{ exact: true }}
                >
                  Dashboard
                </HeaderNavLink>
                <HeaderNavLink
                  to={ROUTES.CONNECT}
                  search={KONTEN_SEARCH_DEFAULTS}
                >
                  Konten
                </HeaderNavLink>
              </>
            ) : null}
            <HeaderNavLink to={ROUTES.RESSOURCEN}>Ressourcen</HeaderNavLink>
            <HeaderNavLink to={ROUTES.FAQ}>FAQ</HeaderNavLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {isSignedIn ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              asChild
            >
              <a href={ROUTES.AUTH_LOGOUT}>
                <LogOut />
                Abmelden
              </a>
            </Button>
          ) : null}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="md:hidden"
                aria-label="Menü öffnen"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
                <SheetDescription className="sr-only">
                  Hauptnavigation
                </SheetDescription>
              </SheetHeader>

              <nav aria-label="Hauptnavigation" className="flex flex-col gap-1">
                {showDashboardLink ? (
                  <>
                    <MobileNavLink
                      to={ROUTES.DASHBOARD}
                      search={dashboardSearch}
                      activeOptions={{ exact: true }}
                    >
                      Dashboard
                    </MobileNavLink>
                    <MobileNavLink
                      to={ROUTES.CONNECT}
                      search={KONTEN_SEARCH_DEFAULTS}
                    >
                      Konten
                    </MobileNavLink>
                  </>
                ) : null}
                <MobileNavLink to={ROUTES.RESSOURCEN}>Ressourcen</MobileNavLink>
                <MobileNavLink to={ROUTES.FAQ}>FAQ</MobileNavLink>
              </nav>

              {isSignedIn ? (
                <Button variant="outline" className="w-full" asChild>
                  <a href={ROUTES.AUTH_LOGOUT}>
                    <LogOut />
                    Abmelden
                  </a>
                </Button>
              ) : null}
            </SheetContent>
          </Sheet>
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
  to: AppNavTo
  children: string
  search?: typeof KONTEN_SEARCH_DEFAULTS
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

function MobileNavLink({
  to,
  children,
  search,
  activeOptions,
}: {
  to: AppNavTo
  children: string
  search?: typeof KONTEN_SEARCH_DEFAULTS
  activeOptions?: { exact: boolean }
}) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        search={search}
        activeOptions={activeOptions}
        className={cn(
          'flex items-center px-3 py-3 font-mono text-sm uppercase tracking-[0.18em] text-terminal-text/70 no-underline transition-colors',
          'hover:bg-terminal-card hover:text-terminal-text',
        )}
        activeProps={{
          className: 'bg-terminal-card text-terminal-lightGreen',
        }}
      >
        {children}
      </Link>
    </SheetClose>
  )
}
