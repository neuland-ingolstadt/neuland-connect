import { createRequire } from 'node:module'
import pino, { type Logger } from 'pino'

const SERVICE_NAME = 'neuland-connect'

function resolveLevel(): string {
  const fromEnv = process.env.LOG_LEVEL?.trim().toLowerCase()
  if (fromEnv) {
    return fromEnv
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function wantsPretty(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  const format = process.env.LOG_FORMAT?.trim().toLowerCase()
  return format !== 'json'
}

/**
 * Prefer a sync pretty stream over `pino.transport()` so Nitro/Vite
 * bundles do not break on worker-thread module resolution.
 */
function createPrettyDestination(): NodeJS.WritableStream | undefined {
  if (!wantsPretty()) {
    return undefined
  }

  try {
    const require = createRequire(import.meta.url)
    const pretty = require('pino-pretty') as (
      opts?: Record<string, unknown>,
    ) => NodeJS.WritableStream

    return pretty({
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
    })
  } catch {
    return undefined
  }
}

const destination = createPrettyDestination()

export const logger: Logger = pino(
  {
    name: SERVICE_NAME,
    level: resolveLevel(),
    base: { service: SERVICE_NAME },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label }
      },
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        'headers.cookie',
        '*.accessToken',
        '*.refreshToken',
        '*.clientSecret',
        '*.botToken',
        '*.apiToken',
        '*.apiKey',
        '*.sessionSecret',
        '*.privateKey',
      ],
      censor: '[Redacted]',
    },
  },
  destination,
)

/** Child logger with a stable `module` field for filtering in prod. */
export function createLogger(module: string): Logger {
  return logger.child({ module })
}
