/// <reference types="vite/client" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly APP_URL: string
      readonly SESSION_SECRET: string
      readonly AUTHENTIK_ISSUER: string
      readonly AUTHENTIK_CLIENT_ID: string
      readonly AUTHENTIK_CLIENT_SECRET: string
      readonly AUTHENTIK_API_URL: string
      readonly AUTHENTIK_API_TOKEN: string
      readonly GITHUB_CLIENT_ID: string
      readonly GITHUB_CLIENT_SECRET: string
      readonly DISCORD_CLIENT_ID: string
      readonly DISCORD_CLIENT_SECRET: string
      readonly DISCORD_BOT_TOKEN: string
      readonly DISCORD_GUILD_ID: string
      readonly DISCORD_PUBLIC_KEY: string
      readonly DISCORD_BOT_GATEWAY?: string
      readonly DISCORD_EVENTS_CHANNEL_ID?: string
      readonly CL_API_KEY?: string
      readonly CL_API_URL?: string
      readonly NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}
