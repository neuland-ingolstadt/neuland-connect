import { createServerFn } from '@tanstack/react-start'
import { disconnectGitHubConnection } from '#/lib/integrations/github/disconnect'

export const disconnectGitHubFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    await disconnectGitHubConnection()
    return { success: true }
  },
)
