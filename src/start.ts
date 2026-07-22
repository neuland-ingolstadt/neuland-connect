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

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}))
