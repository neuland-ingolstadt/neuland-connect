import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BlogPostsPanel } from '#/components/dashboard/blog-posts-panel'
import { DashboardProfilePanel } from '#/components/dashboard/dashboard-profile-panel'
import { DashboardQuickLinks } from '#/components/dashboard/dashboard-quick-links'
import { EventsPanel } from '#/components/dashboard/events-panel'
import { KontenSetupBanner } from '#/components/dashboard/konten-setup-banner'
import { KontenStatusPanel } from '#/components/dashboard/konten-status-panel'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageMain, PageShell } from '#/components/layout/page-shell'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { useSignedInUser } from '#/hooks/use-signed-in-user'
import type { BlogPostsResult } from '#/lib/blog/types'
import type { CampusLifeEventsResult } from '#/lib/campus-life/types'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { useI18n } from '#/lib/i18n/locale-context'
import type { SessionUser } from '#/lib/session-types'
import { getLatestBlogPostsFn } from '#/server/get-blog-posts'
import {
  type CurrentUser,
  requireActiveSession,
} from '#/server/get-current-user'
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

function ProfilePanelSkeleton() {
  const { t } = useI18n()
  return (
    <TerminalPanel title={t('dashboard.profile.title')}>
      <div className="space-y-3 p-4 sm:p-5" aria-busy>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-32" />
      </div>
    </TerminalPanel>
  )
}

function KontenStatusPanelSkeleton() {
  const { t } = useI18n()
  return (
    <TerminalPanel title={t('konten.status.title')}>
      <div className="space-y-3 p-4 sm:p-5" aria-busy>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </TerminalPanel>
  )
}

function AuthentikPanelsError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <TerminalPanel title={t('dashboard.profile.title')}>
      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-sm text-terminal-text/70">{t('boot.errorLead')}</p>
        <p className="font-mono text-[12px] text-terminal-text/55">
          {t('boot.errorDetail')}
        </p>
        {onRetry ? (
          <Button variant="outline" type="button" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : null}
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

    // Cookie only — Authentik profile stays in the sidebar, not the route.
    const sessionUser = await requireActiveSession()
    return { sessionUser }
  },
  pendingMs: 0,
  pendingComponent: DashboardPendingPage,
  component: DashboardRoute,
})

function DashboardRoute() {
  const { sessionUser } = Route.useLoaderData()
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

  return (
    <DashboardPage
      sessionUser={sessionUser}
      user={user}
      userError={error}
      onRetryUser={retry}
      events={events}
      blogPosts={blogPosts}
    />
  )
}

function DashboardPendingPage() {
  return (
    <DashboardPage
      sessionUser={null}
      user={null}
      events={null}
      blogPosts={null}
    />
  )
}

function DashboardPage({
  sessionUser,
  user,
  userError = false,
  onRetryUser,
  events,
  blogPosts,
}: {
  sessionUser: SessionUser | null
  user: CurrentUser | null
  userError?: boolean
  onRetryUser?: () => void
  events: CampusLifeEventsResult | null
  blogPosts: BlogPostsResult | null
}) {
  const { t } = useI18n()
  const firstName = (user?.name ?? sessionUser?.name ?? '').split(' ')[0]

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <PageMain>
        <header className="mb-6">
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          {firstName ? (
            <h1 className="page-title mt-2">
              {t('dashboard.hello', { name: firstName })}
            </h1>
          ) : (
            <Skeleton className="mt-2 h-9 w-48" />
          )}
        </header>

        {user ? <KontenSetupBanner user={user} /> : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {events ? (
              <EventsPanel events={events.events} error={events.error} />
            ) : (
              <EventsPanelSkeleton />
            )}
          </div>
          <div className="min-w-0 space-y-5">
            {user ? (
              <>
                <DashboardProfilePanel
                  name={user.name}
                  username={user.username}
                  groups={user.groups}
                />
                <DashboardQuickLinks groups={user.allGroups} />
                <KontenStatusPanel user={user} />
              </>
            ) : userError ? (
              <AuthentikPanelsError onRetry={onRetryUser} />
            ) : (
              <>
                <ProfilePanelSkeleton />
                <KontenStatusPanelSkeleton />
              </>
            )}
          </div>
        </div>

        <div className="mt-5 min-w-0">
          {blogPosts ? (
            <BlogPostsPanel posts={blogPosts.posts} error={blogPosts.error} />
          ) : (
            <BlogPostsPanelSkeleton />
          )}
        </div>
      </PageMain>

      <LegalFooter />
    </PageShell>
  )
}
