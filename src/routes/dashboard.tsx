import { createFileRoute, defer, redirect } from '@tanstack/react-router'
import { ConnectSetupBanner } from '#/components/dashboard/connect-setup-banner'
import { ConnectStatusPanel } from '#/components/dashboard/connect-status-panel'
import { DashboardProfilePanel } from '#/components/dashboard/dashboard-profile-panel'
import { EventsPanel } from '#/components/dashboard/events-panel'
import { hasNoLinkedAccounts } from '#/components/dashboard/setup-explainer'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Skeleton } from '#/components/ui/skeleton'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import type { CampusLifeEventsResult } from '#/lib/campus-life/types'
import {
  APP_NAME,
  CONNECT_SEARCH_DEFAULTS,
  isDashboardIntroFlag,
  ROUTES,
} from '#/lib/constants'
import {
  LOADER_STALE_MS,
  resolvedDeferred,
} from '#/lib/deferred-loader'
import { DeferredValue } from '#/components/deferred-value'
import {
  type CurrentUser,
  hasActiveSessionFn,
  requireSignedInUser,
} from '#/server/get-current-user'
import { getNeulandEventsFn } from '#/server/get-events'

function EventsPanelSkeleton() {
  return (
    <TerminalPanel title="Events">
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </TerminalPanel>
  )
}

function ProfilePanelsSkeleton() {
  return (
    <>
      <TerminalPanel title="Profil">
        <div className="space-y-3 p-4 sm:p-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </TerminalPanel>
      <TerminalPanel title="Connect">
        <div className="space-y-3 p-4 sm:p-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </TerminalPanel>
    </>
  )
}

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: `Dashboard · ${APP_NAME}` }],
  }),
  staleTime: LOADER_STALE_MS,
  gcTime: 5 * 60_000,
  validateSearch: (search: Record<string, unknown>) => ({
    integration:
      typeof search.integration === 'string' ? search.integration : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    message: typeof search.message === 'string' ? search.message : undefined,
    intro: isDashboardIntroFlag(search.intro) ? true : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: search }) => {
    if (search.integration) {
      throw redirect({
        to: ROUTES.CONNECT,
        search: {
          integration: search.integration,
          status: search.status,
          message: search.message,
          intro: search.intro,
        },
      })
    }

    const hasSession = await hasActiveSessionFn()
    if (!hasSession) {
      throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
    }

    const userPromise = requireSignedInUser().then(user => {
      if (search.intro && hasNoLinkedAccounts(user)) {
        throw redirect({
          to: ROUTES.CONNECT,
          search: {
            ...CONNECT_SEARCH_DEFAULTS,
            intro: true,
          },
        })
      }

      return user
    })

    return {
      user: defer(userPromise),
      events: defer(getNeulandEventsFn()),
    }
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  const { user, events } = Route.useLoaderData()
  const cachedUser = resolvedDeferred(user)
  const cachedEvents = resolvedDeferred(events)

  if (cachedUser && cachedEvents) {
    return <DashboardPage user={cachedUser} events={cachedEvents} />
  }

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <DeferredValue
          value={user}
          fallback={
            <header className="mb-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
                Dashboard
              </p>
              <Skeleton className="mt-2 h-8 w-48 sm:h-9" />
            </header>
          }
        >
          {resolvedUser => (
            <>
              <header className="mb-6">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
                  Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Hallo {resolvedUser.name.split(' ')[0]}
                </h1>
              </header>
              <ConnectSetupBanner user={resolvedUser} />
            </>
          )}
        </DeferredValue>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DeferredValue value={events} fallback={<EventsPanelSkeleton />}>
              {resolvedEvents => (
                <EventsPanel
                  events={resolvedEvents.events}
                  error={resolvedEvents.error}
                />
              )}
            </DeferredValue>
          </div>
          <div className="space-y-5">
            <DeferredValue value={user} fallback={<ProfilePanelsSkeleton />}>
              {resolvedUser => (
                <>
                  <DashboardProfilePanel
                    name={resolvedUser.name}
                    groups={resolvedUser.groups}
                  />
                  <ConnectStatusPanel user={resolvedUser} />
                </>
              )}
            </DeferredValue>
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}

function DashboardPage({
  user,
  events,
}: {
  user: CurrentUser
  events: CampusLifeEventsResult
}) {
  const firstName = user.name.split(' ')[0]

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-text/50">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Hallo {firstName}
          </h1>
        </header>

        <ConnectSetupBanner user={user} />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventsPanel events={events.events} error={events.error} />
          </div>
          <div className="space-y-5">
            <DashboardProfilePanel name={user.name} groups={user.groups} />
            <ConnectStatusPanel user={user} />
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
