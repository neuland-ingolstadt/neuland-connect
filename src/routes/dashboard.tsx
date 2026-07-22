import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { GitHubConnectionCard } from '#/components/dashboard/github-connection-card'
import { MembershipCard } from '#/components/dashboard/membership-card'
import { OnboardingProgress } from '#/components/dashboard/onboarding-progress'
import { UserDataCard } from '#/components/dashboard/user-data-card'
import { AppHeader } from '#/components/layout/app-header'
import { LegalFooter } from '#/components/layout/legal-footer'
import { PageShell } from '#/components/layout/page-shell'
import { Skeleton } from '#/components/ui/skeleton'
import { ROUTES } from '#/lib/constants'
import { isGitHubInOrg } from '#/lib/integrations/github/org-status-display'
import { getCurrentUserFn } from '#/server/get-current-user'

export const Route = createFileRoute('/dashboard')({
  staleTime: 0,
  validateSearch: (search: Record<string, unknown>) => ({
    integration:
      typeof search.integration === 'string' ? search.integration : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    message: typeof search.message === 'string' ? search.message : undefined,
  }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
    }
  },
  loader: async () => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({ to: ROUTES.LOGIN, search: { error: undefined } })
    }

    return { user }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const router = useRouter()
  const { user } = Route.useLoaderData()
  const search = Route.useSearch()

  useEffect(() => {
    if (search.integration !== 'github' || !search.status) {
      return
    }

    if (search.status === 'success') {
      toast.success('GitHub verbunden.')
    } else if (search.status === 'disconnected') {
      toast.success('GitHub-Verbindung getrennt.')
    } else if (search.status === 'error') {
      toast.error('GitHub-Verbindung fehlgeschlagen.')
    }

    void router.invalidate()

    const retryInvalidates = [500, 1500, 4000].map(delay =>
      window.setTimeout(() => {
        void router.invalidate()
      }, delay),
    )

    window.history.replaceState({}, '', ROUTES.DASHBOARD)

    return () => {
      for (const timeoutId of retryInvalidates) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [router, search.integration, search.status])

  useEffect(() => {
    if (!user?.githubConnected) {
      return
    }

    if (isGitHubInOrg(user.attributes.githubOrgStatus)) {
      return
    }

    const intervalId = window.setInterval(() => {
      void router.invalidate()
    }, 3000)

    const stopPollingId = window.setTimeout(() => {
      window.clearInterval(intervalId)
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(stopPollingId)
    }
  }, [router, user])

  if (!user) {
    return <DashboardSkeleton />
  }

  const firstName = user.name.split(' ')[0]

  return (
    <PageShell>
      <AppHeader userName={user.name} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-lightGreen">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Hallo {firstName}
            </h1>
          </div>
        </header>

        <div className="space-y-5">
          <OnboardingProgress
            githubConnected={user.githubConnected}
            githubOrgStatus={user.attributes.githubOrgStatus}
            githubOrg={user.githubOrg}
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <GitHubConnectionCard
                connected={user.githubConnected}
                attributes={user.attributes}
                githubOrg={user.githubOrg}
              />
              <MembershipCard />
            </div>

            <UserDataCard
              name={user.name}
              email={user.email}
              username={user.username}
              groups={user.groups}
              accountCreatedAt={user.accountCreatedAt}
            />
          </div>
        </div>
      </main>

      <LegalFooter className="px-4" />
    </PageShell>
  )
}

function DashboardSkeleton() {
  return (
    <PageShell>
      <div className="border-b border-terminal-window-border bg-terminal-nav">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <Skeleton className="h-8 w-40 bg-terminal-window-border" />
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="mb-6 h-10 w-48 bg-terminal-window-border" />
        <Skeleton className="mb-5 h-16 bg-terminal-window-border" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Skeleton className="h-52 bg-terminal-window-border" />
            <Skeleton className="h-52 bg-terminal-window-border" />
          </div>
          <Skeleton className="h-52 bg-terminal-window-border" />
        </div>
      </main>
    </PageShell>
  )
}
