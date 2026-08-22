import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { LOADER_STALE_MS } from '#/lib/deferred-loader'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      user: null,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: LOADER_STALE_MS,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
