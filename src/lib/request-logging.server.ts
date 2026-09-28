import { createLogger } from '#/lib/logger.server'

const log = createLogger('http')

const SKIP_PREFIXES = [
  '/assets/',
  '/_build/',
  '/favicon',
  '/robots.txt',
  '/manifest',
] as const

const SKIP_EXTENSIONS = [
  '.css',
  '.js',
  '.mjs',
  '.map',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
] as const

function shouldSkipPath(pathname: string): boolean {
  if (SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true
  }

  const lower = pathname.toLowerCase()
  return SKIP_EXTENSIONS.some(ext => lower.endsWith(ext))
}

function statusLevel(status: number): 'error' | 'warn' | 'info' | 'debug' {
  if (status >= 500) {
    return 'error'
  }
  if (status >= 400) {
    return 'warn'
  }
  return 'info'
}

/**
 * Decide whether a completed request is worth an info-level access log.
 * API traffic is always logged; page navigations only when slow or failing.
 */
function shouldLogAccess(
  pathname: string,
  status: number,
  durationMs: number,
): boolean {
  if (pathname.startsWith('/api/')) {
    return true
  }

  if (status >= 400) {
    return true
  }

  // Slow page / server-fn responses are worth surfacing at info.
  return durationMs >= 2_000
}

export type RequestLogContext = {
  request: Request
  pathname: string
  handlerType: 'serverFn' | 'router'
}

export async function withRequestLogging<T extends { response: Response }>(
  ctx: RequestLogContext,
  next: () => Promise<T> | T,
): Promise<T> {
  if (shouldSkipPath(ctx.pathname)) {
    return next()
  }

  const started = performance.now()
  const method = ctx.request.method

  try {
    const result = await next()
    const durationMs = Math.round(performance.now() - started)
    const status = result.response.status
    const fields = {
      method,
      path: ctx.pathname,
      status,
      durationMs,
      handlerType: ctx.handlerType,
    }

    if (shouldLogAccess(ctx.pathname, status, durationMs)) {
      log[statusLevel(status)](fields, 'request')
    } else {
      log.debug(fields, 'request')
    }

    return result
  } catch (error) {
    const durationMs = Math.round(performance.now() - started)
    log.error(
      {
        err: error,
        method,
        path: ctx.pathname,
        durationMs,
        handlerType: ctx.handlerType,
      },
      'request failed',
    )
    throw error
  }
}
