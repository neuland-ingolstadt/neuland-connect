/** Match Authentik user cache TTL in get-current-user.ts */
export const LOADER_STALE_MS = 15_000

export function isDeferred<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>).then === 'function'
}

export function resolvedDeferred<T>(value: T | Promise<T>): T | null {
  if (!isDeferred(value)) {
    return value
  }

  const deferredState = (
    value as Promise<T> & {
      [key: symbol]: { status?: string; data?: T }
    }
  )[Symbol.for('TSR_DEFERRED_PROMISE')]

  if (deferredState?.status === 'success' && deferredState.data !== undefined) {
    return deferredState.data
  }

  return null
}
