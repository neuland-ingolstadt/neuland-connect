import { createFileRoute, defer, redirect } from '@tanstack/react-router'
import { BlogPostsPanel } from '#/components/dashboard/blog-posts-panel'
import { DashboardProfilePanel } from '#/components/dashboard/dashboard-profile-panel'
import { DashboardQuickLinks } from '#/components/dashboard/dashboard-quick-links'
import { EventsPanel } from '#/components/dashboard/events-panel'
import { KontenSetupBanner } from '#/components/dashboard/konten-setup-banner'
import { KontenStatusPanel } from '#/components/dashboard/konten-status-panel'
import { DeferredValue } from '#/components/deferred-value'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Skeleton } from '#/components/ui/skeleton'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import type { BlogPostsResult } from '#/lib/blog/types'
import type { CampusLifeEventsResult } from '#/lib/campus-life/types'
import { APP_NAME, ROUTES } from '#/lib/constants'
import { LOADER_STALE_MS, resolvedDeferred } from '#/lib/deferred-loader'
import type { SessionUser } from '#/lib/session-types'
import { getLatestBlogPostsFn } from '#/server/get-blog-posts'
import {
  type CurrentUser,
  loadSignedInUser,
  requireActiveSession,
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

function BlogPostsPanelSkeleton() {
  return (
    <TerminalPanel title="Blog">
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
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
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </TerminalPanel>
      <TerminalPanel title="Schnellzugriff">
        <div className="space-y-0 border-t border-terminal-window-border/50 p-0">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Skeleton className="size-8 shrink-0" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Skeleton className="size-8 shrink-0" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </TerminalPanel>
      <TerminalPanel title="Konten">
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
        to: ROUTES.CONNECT,
        search: {
          integration: deps.integration,
          status: callbackSearch.status,
          message: callbackSearch.message,
        },
      })
    }

    // Cookie gate only — Authentik profile streams via defer so the shell paints
    // immediately (greeting from session name; panels skeleton until ready).
    const sessionUser = await requireActiveSession()

    return {
      sessionUser,
      user: defer(loadSignedInUser()),
      events: defer(getNeulandEventsFn()),
      blogPosts: defer(getLatestBlogPostsFn()),
    }
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  const { sessionUser, user, events, blogPosts } = Route.useLoaderData()
  const firstName = sessionUser.name.split(' ')[0]
  const cachedUser = resolvedDeferred(user)
  const cachedEvents = resolvedDeferred(events)
  const cachedBlogPosts = resolvedDeferred(blogPosts)

  if (cachedUser && cachedEvents && cachedBlogPosts) {
    return (
      <DashboardPage
        sessionUser={sessionUser}
        user={cachedUser}
        events={cachedEvents}
        blogPosts={cachedBlogPosts}
      />
    )
  }

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-terminal-text/50">
            Dashboard
          </p>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight sm:text-3xl">
            Hallo {firstName}
          </h1>
        </header>

        <DeferredValue value={user} fallback={null}>
          {resolvedUser => <KontenSetupBanner user={resolvedUser} />}
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
                    username={resolvedUser.username}
                    groups={resolvedUser.groups}
                  />
                  <DashboardQuickLinks groups={resolvedUser.allGroups} />
                  <KontenStatusPanel user={resolvedUser} />
                </>
              )}
            </DeferredValue>
          </div>
        </div>

        <div className="mt-5">
          <DeferredValue
            value={blogPosts}
            fallback={<BlogPostsPanelSkeleton />}
          >
            {resolvedBlogPosts => (
              <BlogPostsPanel
                posts={resolvedBlogPosts.posts}
                error={resolvedBlogPosts.error}
              />
            )}
          </DeferredValue>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}

function DashboardPage({
  sessionUser,
  user,
  events,
  blogPosts,
}: {
  sessionUser: SessionUser
  user: CurrentUser
  events: CampusLifeEventsResult
  blogPosts: BlogPostsResult
}) {
  const firstName = (user.name || sessionUser.name).split(' ')[0]

  return (
    <PageShell>
      <AppHeader isSignedIn />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-terminal-text/50">
            Dashboard
          </p>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight sm:text-3xl">
            Hallo {firstName}
          </h1>
        </header>

        <KontenSetupBanner user={user} />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventsPanel events={events.events} error={events.error} />
          </div>
          <div className="space-y-5">
            <DashboardProfilePanel
              name={user.name}
              username={user.username}
              groups={user.groups}
            />
            <DashboardQuickLinks groups={user.allGroups} />
            <KontenStatusPanel user={user} />
          </div>
        </div>

        <div className="mt-5">
          <BlogPostsPanel posts={blogPosts.posts} error={blogPosts.error} />
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}
