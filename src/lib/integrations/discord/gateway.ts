const DISCORD_GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json'

const GATEWAY_OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  RECONNECT: 7,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
} as const

const MAX_RECONNECT_DELAY_MS = 60_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 41_250
const MIN_HEARTBEAT_INTERVAL_MS = 1_000
const MAX_HEARTBEAT_INTERVAL_MS = 60_000

function clampHeartbeatInterval(intervalMs: unknown): number {
  if (typeof intervalMs !== 'number' || !Number.isFinite(intervalMs)) {
    return DEFAULT_HEARTBEAT_INTERVAL_MS
  }

  return Math.min(
    Math.max(Math.trunc(intervalMs), MIN_HEARTBEAT_INTERVAL_MS),
    MAX_HEARTBEAT_INTERVAL_MS,
  )
}

type GatewayPayload = {
  op: number
  d?: unknown
  s?: number | null
  t?: string | null
}

class DiscordGatewayClient {
  private socket: WebSocket | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private lastSequence: number | null = null
  private reconnectAttempts = 0
  private stopped = false
  private readonly token: string
  private readonly presenceLabel: string

  constructor(token: string, presenceLabel: string) {
    this.token = token
    this.presenceLabel = presenceLabel
  }

  start(): void {
    this.stopped = false
    this.connect()
  }

  stop(): void {
    this.stopped = true
    this.clearReconnectTimer()
    this.cleanupSocket()
  }

  private connect(): void {
    if (this.stopped) {
      return
    }

    this.cleanupSocket()

    const socket = new WebSocket(DISCORD_GATEWAY_URL)
    this.socket = socket

    socket.addEventListener('open', () => {
      this.reconnectAttempts = 0
    })

    socket.addEventListener('message', event => {
      this.handleMessage(String(event.data))
    })

    socket.addEventListener('close', () => {
      this.cleanupSocket()
      this.scheduleReconnect()
    })

    socket.addEventListener('error', () => {
      socket.close()
    })
  }

  private handleMessage(rawPayload: string): void {
    let payload: GatewayPayload

    try {
      payload = JSON.parse(rawPayload) as GatewayPayload
    } catch {
      return
    }

    if (payload.s !== undefined && payload.s !== null) {
      this.lastSequence = payload.s
    }

    switch (payload.op) {
      case GATEWAY_OPCODES.HELLO: {
        const heartbeatInterval = clampHeartbeatInterval(
          (payload.d as { heartbeat_interval?: number }).heartbeat_interval,
        )
        this.startHeartbeat(heartbeatInterval)
        this.identify()
        break
      }
      case GATEWAY_OPCODES.HEARTBEAT_ACK:
        break
      case GATEWAY_OPCODES.DISPATCH:
        if (payload.t === 'READY') {
          this.updatePresence()
        }
        break
      case GATEWAY_OPCODES.RECONNECT:
        this.cleanupSocket()
        this.scheduleReconnect()
        break
      case GATEWAY_OPCODES.INVALID_SESSION: {
        const resume = Boolean(payload.d)
        this.cleanupSocket()
        this.scheduleReconnect(resume ? 1_000 : 5_000)
        break
      }
      default:
        break
    }
  }

  private identify(): void {
    this.send({
      op: GATEWAY_OPCODES.IDENTIFY,
      d: {
        token: `Bot ${this.token}`,
        intents: 0,
        properties: {
          os: 'linux',
          browser: 'neuland-connect',
          device: 'neuland-connect',
        },
      },
    })
  }

  private updatePresence(): void {
    this.send({
      op: GATEWAY_OPCODES.PRESENCE_UPDATE,
      d: {
        since: null,
        activities: [
          {
            name: this.presenceLabel,
            type: 0,
          },
        ],
        status: 'dnd',
        afk: false,
      },
    })
  }

  private startHeartbeat(intervalMs: number): void {
    this.clearHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.send({
        op: GATEWAY_OPCODES.HEARTBEAT,
        d: this.lastSequence,
      })
    }, intervalMs)
  }

  private send(payload: GatewayPayload): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload))
    }
  }

  private scheduleReconnect(baseDelayMs = 1_000): void {
    if (this.stopped) {
      return
    }

    this.clearReconnectTimer()

    const delay = Math.min(
      baseDelayMs * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    )
    this.reconnectAttempts += 1

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private cleanupSocket(): void {
    this.clearHeartbeat()

    if (!this.socket) {
      return
    }

    this.socket.close()
    this.socket = null
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

let gatewayClient: DiscordGatewayClient | null = null

export function startDiscordGateway(
  token: string,
  presenceLabel: string,
): void {
  if (gatewayClient) {
    return
  }

  gatewayClient = new DiscordGatewayClient(token, presenceLabel)
  gatewayClient.start()
}

export function stopDiscordGateway(): void {
  gatewayClient?.stop()
  gatewayClient = null
}
