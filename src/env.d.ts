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
      readonly NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}
