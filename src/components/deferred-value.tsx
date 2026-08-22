import { Await } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { isDeferred, resolvedDeferred } from '#/lib/deferred-loader'

export function DeferredValue<T>({
  value,
  fallback,
  children,
}: {
  value: T | Promise<T>
  fallback: ReactNode
  children: (resolved: T) => ReactNode
}) {
  const cached = resolvedDeferred(value)
  if (cached !== null) {
    return children(cached)
  }

  if (isDeferred(value)) {
    return (
      <Await promise={value} fallback={fallback}>
        {children}
      </Await>
    )
  }

  return children(value)
}
