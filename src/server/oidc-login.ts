import { createServerFn } from '@tanstack/react-start'

/** Fresh PKCE authorize URL for the login page (POST so it is never cached). */
export const getOidcAuthorizeUrlFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<string> => {
    const { prepareOidcLogin } = await import('#/lib/auth/oidc')
    return prepareOidcLogin()
  },
)
