const DISCORD_GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json'
const DISCORD_PRESENCE_URL = 'https://connect.neuland.ing'
const DISCORD_ACTIVITY_WATCHING = 3

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

const DEFAULT_RECONNECT_DELAY_MS = 1_000
const RESUME_RECONNECT_DELAY_MS = 1_000
const INVALID_SESSION_RECONNECT_DELAY_MS = 5_000
const MAX_RECONNECT_DELAY_MS = 60_000
const DEFAULT_HEARTBEAT_INTERVAL_MS = 41_250

function clampReconnectDelay(delayMs: number): number {
  return Math.min(Math.max(Math.trunc(delayMs), 0), MAX_RECONNECT_DELAY_MS)
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

  constructor(token: string) {
    this.token = token
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
      this.scheduleReconnect(DEFAULT_RECONNECT_DELAY_MS)
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
        this.startHeartbeat()
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
        this.scheduleReconnect(DEFAULT_RECONNECT_DELAY_MS)
        break
      case GATEWAY_OPCODES.INVALID_SESSION: {
        const resume = Boolean(payload.d)
        this.cleanupSocket()
        this.scheduleReconnect(
          resume
            ? RESUME_RECONNECT_DELAY_MS
            : INVALID_SESSION_RECONNECT_DELAY_MS,
        )
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
            name: DISCORD_PRESENCE_URL,
            type: DISCORD_ACTIVITY_WATCHING,
            url: DISCORD_PRESENCE_URL,
          },
        ],
        status: 'dnd',
        afk: false,
      },
    })
  }

  private startHeartbeat(): void {
    this.clearHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.send({
        op: GATEWAY_OPCODES.HEARTBEAT,
        d: this.lastSequence,
      })
    }, DEFAULT_HEARTBEAT_INTERVAL_MS)
  }

  private send(payload: GatewayPayload): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload))
    }
  }

  private scheduleReconnect(baseDelayMs: number): void {
    if (this.stopped) {
      return
    }

    this.clearReconnectTimer()

    const delay = clampReconnectDelay(baseDelayMs * 2 ** this.reconnectAttempts)
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

export function startDiscordGateway(token: string): void {
  if (gatewayClient) {
    return
  }

  gatewayClient = new DiscordGatewayClient(token)
  gatewayClient.start()
}

export function stopDiscordGateway(): void {
  gatewayClient?.stop()
  gatewayClient = null
}
