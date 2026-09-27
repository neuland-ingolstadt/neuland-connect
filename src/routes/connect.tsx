import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTES } from '#/lib/constants'

/**
 * Legacy path — the accounts page moved to `/konten`.
 * Keeps old bookmarks and shared links working.
 */
export const Route = createFileRoute('/connect')({
  validateSearch: (search: Record<string, unknown>) => ({
    integration:
      typeof search.integration === 'string' ? search.integration : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    message: typeof search.message === 'string' ? search.message : undefined,
  }),
  loaderDeps: ({ search }) => ({ ...search }),
  loader: ({ deps, location }) => {
    throw redirect({
      to: ROUTES.KONTEN,
      search: {
        integration: deps.integration,
        status: deps.status,
        message: deps.message,
      },
      hash: location.hash || undefined,
    })
  },
})
