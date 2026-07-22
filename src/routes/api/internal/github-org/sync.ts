import { createFileRoute } from '@tanstack/react-router'
import { serverConfig } from '#/lib/config'
import { reconcileGitHubOrgMembership } from '#/lib/integrations/github/sync'

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim() || null
}

export const Route = createFileRoute('/api/internal/github-org/sync')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = serverConfig.cronSecret
        if (!cronSecret) {
          return new Response(
            JSON.stringify({ error: 'CRON_SECRET is not configured' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        const token = extractBearerToken(request)
        if (!token || token !== cronSecret) {
          return unauthorizedResponse()
        }

        // Reconcile can exceed TanStack Start's 120s SSR stream lifetime when
        // many users need GitHub API calls. Run in the background and return
        // immediately so cron callers get a timely HTTP response.
        void reconcileGitHubOrgMembership()
          .then(result => {
            console.log('[github-org] Background reconcile completed:', {
              configured: result.configured,
              processed: result.processed,
              members: result.members,
              invited: result.invited,
              skipped: result.skipped,
              errors: result.errors,
            })
          })
          .catch(error => {
            console.error('[github-org] Background reconcile failed:', error)
          })

        return new Response(JSON.stringify({ ok: true, status: 'started' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
