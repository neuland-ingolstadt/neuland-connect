import { Link } from '@tanstack/react-router'
import { LogOut, Menu } from 'lucide-react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { LanguageToggle } from '#/components/layout/language-toggle'
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
import { useI18n } from '#/lib/i18n/locale-context'

type AppHeaderProps = {
  isSignedIn?: boolean
  showDashboardLink?: boolean
}

type AppNavTo =
  | typeof ROUTES.DASHBOARD
  | typeof ROUTES.KONTEN
  | typeof ROUTES.SCANNER
  | typeof ROUTES.RESSOURCEN
  | typeof ROUTES.FAQ

const dashboardSearch = KONTEN_SEARCH_DEFAULTS

export function AppHeader({
  isSignedIn = false,
  showDashboardLink = true,
}: AppHeaderProps) {
  const { t } = useI18n()
  const logo = (
    <>
      <NeulandPalm className="h-9 w-auto text-terminal-text" />
      <div className="leading-tight">
        <span className="block font-mono text-sm font-semibold tracking-wide text-terminal-text">
          Neuland
        </span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-terminal-text/50">
          Connect
        </span>
      </div>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 border-b border-terminal-window-border bg-terminal-nav/90 backdrop-blur-sm">
      <div className="page-gutter mx-auto flex h-16 w-full min-w-0 max-w-6xl items-center justify-between gap-4">
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

          {isSignedIn ? (
            <nav
              aria-label={t('nav.main')}
              className="hidden items-center gap-2 md:flex"
            >
              {showDashboardLink ? (
                <>
                  <HeaderNavLink to={ROUTES.DASHBOARD} search={dashboardSearch}>
                    {t('nav.dashboard')}
                  </HeaderNavLink>
                  <HeaderNavLink
                    to={ROUTES.KONTEN}
                    search={KONTEN_SEARCH_DEFAULTS}
                  >
                    {t('nav.konten')}
                  </HeaderNavLink>
                  <HeaderNavLink to={ROUTES.SCANNER}>
                    {t('nav.scanner')}
                  </HeaderNavLink>
                </>
              ) : null}
              <HeaderNavLink to={ROUTES.RESSOURCEN}>
                {t('nav.ressourcen')}
              </HeaderNavLink>
              <HeaderNavLink to={ROUTES.FAQ}>{t('nav.faq')}</HeaderNavLink>
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle />
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
                {t('header.logout')}
              </a>
            </Button>
          ) : null}

          {isSignedIn ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label={t('nav.openMenu')}
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              >
                <SheetHeader>
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {t('nav.main')}
                  </SheetDescription>
                </SheetHeader>

                <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
                  {showDashboardLink && isSignedIn ? (
                    <>
                      <MobileNavLink
                        to={ROUTES.DASHBOARD}
                        search={dashboardSearch}
                      >
                        {t('nav.dashboard')}
                      </MobileNavLink>
                      <MobileNavLink
                        to={ROUTES.KONTEN}
                        search={KONTEN_SEARCH_DEFAULTS}
                      >
                        {t('nav.konten')}
                      </MobileNavLink>
                      <MobileNavLink to={ROUTES.SCANNER}>
                        {t('nav.scanner')}
                      </MobileNavLink>
                    </>
                  ) : null}
                  <MobileNavLink to={ROUTES.RESSOURCEN}>
                    {t('nav.ressourcen')}
                  </MobileNavLink>
                  <MobileNavLink to={ROUTES.FAQ}>{t('nav.faq')}</MobileNavLink>
                </nav>

                <div className="flex items-center gap-2">
                  <LanguageToggle size="sm" className="flex-1" />
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={ROUTES.AUTH_LOGOUT}>
                      <LogOut />
                      {t('header.logout')}
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </div>
    </header>
  )
}

const navActiveOptions = { exact: true, includeSearch: false } as const

function HeaderNavLink({
  to,
  children,
  search,
}: {
  to: AppNavTo
  children: string
  search?: typeof KONTEN_SEARCH_DEFAULTS
}) {
  return (
    <Link
      to={to}
      search={search}
      activeOptions={navActiveOptions}
      className="px-2 py-1 text-sm font-medium tracking-tight transition-colors"
      inactiveProps={{
        className:
          'text-terminal-text/55 no-underline hover:text-terminal-text',
      }}
      activeProps={{
        className:
          'text-terminal-text underline decoration-terminal-green/60 decoration-2 underline-offset-8',
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
}: {
  to: AppNavTo
  children: string
  search?: typeof KONTEN_SEARCH_DEFAULTS
}) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        search={search}
        activeOptions={navActiveOptions}
        className="flex items-center px-3 py-3 text-sm font-medium tracking-tight no-underline transition-colors"
        inactiveProps={{
          className:
            'text-terminal-text/70 hover:bg-terminal-card hover:text-terminal-text',
        }}
        activeProps={{
          className: 'bg-terminal-card text-terminal-text',
        }}
      >
        {children}
      </Link>
    </SheetClose>
  )
}
