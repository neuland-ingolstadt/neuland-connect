import { createFileRoute } from '@tanstack/react-router'
import { serverConfig } from '#/lib/config'
import { reconcileGitHubTeamMembership } from '#/lib/integrations/github/teams-sync'

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

export const Route = createFileRoute('/api/internal/github-teams/sync')({
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

        if (!serverConfig.github.isTeamSyncConfigured) {
          return new Response(
            JSON.stringify({
              error:
                'GitHub team sync is not configured (need GitHub App + GITHUB_ORG)',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        void reconcileGitHubTeamMembership()
          .then(result => {
            console.log('[github-teams] Background reconcile completed:', {
              configured: result.configured,
              teams: result.teams,
              candidates: result.candidates,
              added: result.added,
              removed: result.removed,
              errors: result.errors,
            })
          })
          .catch(error => {
            console.error('[github-teams] Background reconcile failed:', error)
          })

        return new Response(JSON.stringify({ ok: true, status: 'started' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
