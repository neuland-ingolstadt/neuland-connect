const AUTHENTIK_ERROR_PATTERN = /^Authentik API request failed \((\d+)\)/

export type AppErrorDetails = {
  title: string
  description: string
  technicalMessage: string
  isRetryable: boolean
  showLoginLink: boolean
}

export function getAuthentikErrorMessage(status: number): string {
  if (status === 503 || status === 502 || status === 504) {
    return 'Der Authentifizierungsdienst ist momentan nicht erreichbar. Bitte versuche es in ein paar Minuten erneut.'
  }

  if (status >= 500) {
    return 'Der Authentifizierungsdienst hat einen Fehler zurückgegeben. Bitte versuche es später erneut.'
  }

  if (status === 401 || status === 403) {
    return 'Keine Berechtigung für den Authentifizierungsdienst. Bitte wende dich an den Administrator.'
  }

  if (status === 404) {
    return 'Der angeforderte Benutzer konnte in Authentik nicht gefunden werden.'
  }

  return 'Ein Fehler ist bei der Kommunikation mit dem Authentifizierungsdienst aufgetreten.'
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

export function parseAppError(error: unknown): AppErrorDetails {
  const technicalMessage = sanitizeTechnicalMessage(getErrorMessage(error))
  const status = getErrorStatus(error)

  if (error instanceof Error && error.name === 'AuthentikApiError') {
    const resolvedStatus = status ?? 0

    return {
      title: 'Authentifizierung nicht verfügbar',
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
      title: 'Authentifizierung nicht verfügbar',
      description: getAuthentikErrorMessage(matchedStatus),
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
      title: 'Authentifizierung nicht verfügbar',
      description:
        'Der Anmeldedienst ist momentan nicht erreichbar. Bitte versuche es in ein paar Minuten erneut.',
      technicalMessage,
      isRetryable: true,
      showLoginLink: true,
    }
  }

  return {
    title: 'Etwas ist schiefgelaufen',
    description:
      'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
    technicalMessage,
    isRetryable: true,
    showLoginLink: false,
  }
}
