export type OidcDiscoveryDocument = {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint?: string
}

export type OidcTokenResponse = {
  access_token: string
  refresh_token?: string
  id_token?: string
  token_type: string
  expires_in?: number
}

export type OidcUserInfo = {
  sub: string
  email?: string
  name?: string
  preferred_username?: string
}
