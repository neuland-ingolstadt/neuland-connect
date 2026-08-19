export type SessionUser = {
  sub: string
  authentikUserId?: string
  email: string
  name: string
  username?: string
}

export type SessionOidc = {
  idToken?: string
}

export type SessionData = {
  user?: SessionUser
  oidc?: SessionOidc
  oidcState?: string
  oidcCodeVerifier?: string
  githubOAuthState?: string
  discordOAuthState?: string
}
