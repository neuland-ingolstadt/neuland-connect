import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { ConnectBootScreen } from '#/components/layout/connect-boot-screen'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      user: null,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: ConnectBootScreen,
    defaultPendingMs: 400,
    defaultPendingMinMs: 350,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
