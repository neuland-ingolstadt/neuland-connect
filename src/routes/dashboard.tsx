import { Await, createFileRoute, defer, redirect } from '@tanstack/react-router'
import { ConnectSetupBanner } from '#/components/dashboard/connect-setup-banner'
import { ConnectStatusPanel } from '#/components/dashboard/connect-status-panel'
import { DashboardProfilePanel } from '#/components/dashboard/dashboard-profile-panel'
import { EventsPanel } from '#/components/dashboard/events-panel'
import { hasNoLinkedAccounts } from '#/components/dashboard/setup-explainer'
import { AppHeader } from '#/components/layout/app-header'
import { ConnectBootScreen } from '#/components/layout/connect-boot-screen'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import type { CampusLifeEventsResult } from '#/lib/campus-life/types'
import {
  APP_NAME,
  CONNECT_SEARCH_DEFAULTS,
  isDashboardIntroFlag,
  ROUTES,
} from '#/lib/constants'
import {
  type CurrentUser,
  requireSignedInUser,
} from '#/server/get-current-user'
import { getNeulandEventsFn } from '#/server/get-events'

/**
 * First SSR document: Authentik still runs on the server. Router pending UI
 * is client-only, so we race and defer to stream ConnectBootScreen if slow.
 *
 * Client navigations never defer. Router SWR shows the cached dashboard
 * immediately and revalidates in the background.
 */
const BOOT_PENDING_MS = 150
const BOOT_PENDING_MIN_MS = 350

type DashboardData = {
  user: CurrentUser
  events: CampusLifeEventsResult
}

function waitMs(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}

function isDeferredData(
  data: DashboardData | Promise<DashboardData>,
): data is Promise<DashboardData> {
  return typeof (data as Promise<DashboardData>).then === 'function'
}

function resolvedCachedData(
  data: DashboardData | Promise<DashboardData>,
): DashboardData | null {
  if (!isDeferredData(data)) {
    return data
  }

  const deferredState = (
    data as Promise<DashboardData> & {
      [key: symbol]: { status?: string; data?: DashboardData }
    }
  )[Symbol.for('TSR_DEFERRED_PROMISE')]

  if (deferredState?.status === 'success' && deferredState.data) {
    return deferredState.data
  }

  return null
}

async function loadDashboardData(): Promise<DashboardData> {
  const [user, events] = await Promise.all([
    requireSignedInUser(),
    getNeulandEventsFn(),
  ])

  return { user, events }
}

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: `Dashboard · ${APP_NAME}` }],
  }),
  staleTime: 0,
  gcTime: 5 * 60_000,
  pendingMs: Number.POSITIVE_INFINITY,
  pendingComponent: ConnectBootScreen,
  validateSearch: (search: Record<string, unknown>) => ({
    integration:
      typeof search.integration === 'string' ? search.integration : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    message: typeof search.message === 'string' ? search.message : undefined,
    intro: isDashboardIntroFlag(search.intro) ? true : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: search }) => {
    const dataPromise = loadDashboardData()

    const redirectIfNeeded = async (data: DashboardData) => {
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

      if (search.intro && hasNoLinkedAccounts(data.user)) {
        throw redirect({
          to: ROUTES.CONNECT,
          search: {
            ...CONNECT_SEARCH_DEFAULTS,
            intro: true,
          },
        })
      }

      return data
    }

    if (!import.meta.env.SSR) {
      return { data: await redirectIfNeeded(await dataPromise) }
    }

    const startedAt = Date.now()
    const raced = await Promise.race([
      dataPromise.then(data => ({ ready: true as const, data })),
      waitMs(BOOT_PENDING_MS).then(() => ({ ready: false as const })),
    ])

    if (raced.ready) {
      return { data: await redirectIfNeeded(raced.data) }
    }

    return {
      data: defer(
        dataPromise.then(async data => {
          const bootVisibleFor = Date.now() - startedAt - BOOT_PENDING_MS
          const remaining = BOOT_PENDING_MIN_MS - bootVisibleFor
          if (remaining > 0) {
            await waitMs(remaining)
          }
          return redirectIfNeeded(data)
        }),
      ),
    }
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  const { data } = Route.useLoaderData()
  const cached = resolvedCachedData(data)

  if (cached) {
    return <DashboardPage data={cached} />
  }

  if (isDeferredData(data)) {
    return (
      <Await promise={data} fallback={<ConnectBootScreen />}>
        {resolved => <DashboardPage data={resolved} />}
      </Await>
    )
  }

  return <DashboardPage data={data} />
}

function DashboardPage({ data }: { data: DashboardData }) {
  const firstName = data.user.name.split(' ')[0]

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

        <ConnectSetupBanner user={data.user} />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventsPanel
              events={data.events.events}
              error={data.events.error}
            />
          </div>
          <div className="space-y-5">
            <DashboardProfilePanel
              name={data.user.name}
              groups={data.user.groups}
            />
            <ConnectStatusPanel user={data.user} />
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
