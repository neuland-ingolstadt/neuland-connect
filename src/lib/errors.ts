import type { Locale } from '#/lib/i18n/messages'
import { translate } from '#/lib/i18n/messages'

const AUTHENTIK_ERROR_PATTERN = /^Authentik API request failed \((\d+)\)/

export type AppErrorDetails = {
  title: string
  description: string
  technicalMessage: string
  isRetryable: boolean
  showLoginLink: boolean
}

export function getAuthentikErrorMessage(
  status: number,
  locale: Locale = 'de',
): string {
  if (status === 503 || status === 502 || status === 504) {
    return translate(locale, 'error.authentik.unavailable')
  }

  if (status >= 500) {
    return translate(locale, 'error.authentik.serverError')
  }

  if (status === 401 || status === 403) {
    return translate(locale, 'error.authentik.forbidden')
  }

  if (status === 404) {
    return translate(locale, 'error.authentik.notFound')
  }

  return translate(locale, 'error.authentik.generic')
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unbekannter Fehler'
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status
  }

  return undefined
}

function sanitizeTechnicalMessage(message: string): string {
  if (message.includes('<!DOCTYPE') || message.includes('<html')) {
    const statusMatch = message.match(AUTHENTIK_ERROR_PATTERN)

    if (statusMatch) {
      return `Authentik API request failed (${statusMatch[1]})`
    }

    return 'Authentik API request failed'
  }

  if (message.length > 500) {
    return `${message.slice(0, 500)}…`
  }

  return message
}

function isAuthentikOutageStatus(status: number): boolean {
  return status >= 500 || status === 429
}

export function parseAppError(
  error: unknown,
  locale: Locale = 'de',
): AppErrorDetails {
  const technicalMessage = sanitizeTechnicalMessage(getErrorMessage(error))
  const status = getErrorStatus(error)

  if (error instanceof Error && error.name === 'AuthentikApiError') {
    const resolvedStatus = status ?? 0

    return {
      title: translate(locale, 'error.auth.title'),
      description: error.message,
      technicalMessage,
      isRetryable:
        resolvedStatus === 0 || isAuthentikOutageStatus(resolvedStatus),
      showLoginLink: false,
    }
  }

  const authentikMatch = technicalMessage.match(AUTHENTIK_ERROR_PATTERN)

  if (authentikMatch) {
    const matchedStatus = Number(authentikMatch[1])

    return {
      title: translate(locale, 'error.auth.title'),
      description: getAuthentikErrorMessage(matchedStatus, locale),
      technicalMessage,
      isRetryable: isAuthentikOutageStatus(matchedStatus),
      showLoginLink: false,
    }
  }

  if (
    technicalMessage.includes('OIDC discovery') ||
    technicalMessage.includes('Authentik OIDC')
  ) {
    return {
      title: translate(locale, 'error.auth.title'),
      description: translate(locale, 'error.authentik.oidc'),
      technicalMessage,
      isRetryable: true,
      showLoginLink: true,
    }
  }

  return {
    title: translate(locale, 'error.app.title'),
    description: translate(locale, 'error.app.description'),
    technicalMessage,
    isRetryable: true,
    showLoginLink: false,
  }
}
