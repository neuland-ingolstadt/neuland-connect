import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { getSecurityHeaders } from '#/lib/security-headers'

const csrfMiddleware = createCsrfMiddleware({
  filter: ctx => ctx.handlerType === 'serverFn',
})

const securityHeadersMiddleware = createMiddleware().server(
  async ({ next }) => {
    for (const [name, value] of Object.entries(getSecurityHeaders())) {
      setResponseHeader(name, value)
    }
    return next()
  },
)

const requestLoggingMiddleware = createMiddleware().server(
  async ({ next, request, pathname, handlerType }) => {
    const { withRequestLogging } = await import('#/lib/request-logging.server')
    return withRequestLogging({ request, pathname, handlerType }, () => next())
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [
    requestLoggingMiddleware,
    securityHeadersMiddleware,
    csrfMiddleware,
  ],
}))
