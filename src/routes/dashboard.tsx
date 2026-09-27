import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BlogPostsPanel } from '#/components/dashboard/blog-posts-panel'
import { DashboardProfilePanel } from '#/components/dashboard/dashboard-profile-panel'
import { DashboardQuickLinks } from '#/components/dashboard/dashboard-quick-links'
import { EventsPanel } from '#/components/dashboard/events-panel'
import { KontenSetupBanner } from '#/components/dashboard/konten-setup-banner'
import { KontenStatusPanel } from '#/components/dashboard/konten-status-panel'
import { AppHeader } from '#/components/layout/app-header'
import { ConnectBootScreen } from '#/components/layout/connect-boot-screen'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageMain, PageShell } from '#/components/layout/page-shell'
import { Skeleton } from '#/components/ui/skeleton'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { useSignedInUser } from '#/hooks/use-signed-in-user'
import type { BlogPostsResult } from '#/lib/blog/types'
import type { CampusLifeEventsResult } from '#/lib/campus-life/types'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { useI18n } from '#/lib/i18n/locale-context'
import { getLatestBlogPostsFn } from '#/server/get-blog-posts'
import type { CurrentUser } from '#/server/get-current-user'
import { requireActiveSession } from '#/server/get-current-user'
import { getNeulandEventsFn } from '#/server/get-events'

function EventsPanelSkeleton() {
  const { t } = useI18n()
  return (
    <TerminalPanel title={t('dashboard.eventsSkeleton')}>
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </TerminalPanel>
  )
}

function BlogPostsPanelSkeleton() {
  const { t } = useI18n()
  return (
    <TerminalPanel title={t('dashboard.blogSkeleton')}>
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </TerminalPanel>
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
  }),
  loaderDeps: ({ search }) => ({
    integration: search.integration,
  }),
  loader: async ({ deps, location }) => {
    if (deps.integration) {
      const callbackSearch = location.search as {
        status?: string
        message?: string
      }

      throw redirect({
        to: ROUTES.KONTEN,
        search: {
          integration: deps.integration,
          status: callbackSearch.status,
          message: callbackSearch.message,
        },
      })
    }

    // Cookie only — profile/events/blog load client-side so SSR paints immediately.
    await requireActiveSession()
  },
  pendingMs: 0,
  pendingComponent: ConnectBootScreen,
  component: DashboardRoute,
})

function DashboardRoute() {
  const { user, error, retry } = useSignedInUser()
  const [events, setEvents] = useState<CampusLifeEventsResult | null>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPostsResult | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const [nextEvents, nextBlogPosts] = await Promise.all([
        getNeulandEventsFn(),
        getLatestBlogPostsFn(),
      ])

      if (cancelled) {
        return
      }

      setEvents(nextEvents)
      setBlogPosts(nextBlogPosts)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!user) {
    return <ConnectBootScreen error={error} onRetry={retry} />
  }

  if (events && blogPosts) {
    return <DashboardPage user={user} events={events} blogPosts={blogPosts} />
  }

  return <DashboardLoadingPage user={user} />
}

function DashboardLoadingPage({ user }: { user: CurrentUser }) {
  const { t } = useI18n()
  return (
    <PageShell>
      <AppHeader isSignedIn />

      <PageMain>
        <header className="mb-6">
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="page-title mt-2">
            {t('dashboard.hello', { name: user.name.split(' ')[0] })}
          </h1>
        </header>

        <KontenSetupBanner user={user} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <EventsPanelSkeleton />
          </div>
          <div className="min-w-0 space-y-5">
            <DashboardProfilePanel
              name={user.name}
              username={user.username}
              groups={user.groups}
            />
            <DashboardQuickLinks groups={user.allGroups} />
            <KontenStatusPanel user={user} />
          </div>
        </div>

        <div className="mt-5 min-w-0">
          <BlogPostsPanelSkeleton />
        </div>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}

function DashboardPage({
  user,
  events,
  blogPosts,
}: {
  user: CurrentUser
  events: CampusLifeEventsResult
  blogPosts: BlogPostsResult
}) {
  const firstName = user.name.split(' ')[0]
  const { t } = useI18n()

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <PageMain>
        <header className="mb-6">
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="page-title mt-2">
            {t('dashboard.hello', { name: firstName })}
          </h1>
        </header>

        <KontenSetupBanner user={user} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <EventsPanel events={events.events} error={events.error} />
          </div>
          <div className="min-w-0 space-y-5">
            <DashboardProfilePanel
              name={user.name}
              username={user.username}
              groups={user.groups}
            />
            <DashboardQuickLinks groups={user.allGroups} />
            <KontenStatusPanel user={user} />
          </div>
        </div>

        <div className="mt-5 min-w-0">
          <BlogPostsPanel posts={blogPosts.posts} error={blogPosts.error} />
        </div>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
