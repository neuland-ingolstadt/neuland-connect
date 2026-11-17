import { createFileRoute } from '@tanstack/react-router'
import { getHealthReport, healthHttpStatus } from '#/lib/health'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => {
        const report = getHealthReport()
        return Response.json(report, {
          status: healthHttpStatus(report),
          headers: {
            'Cache-Control': 'no-store',
          },
        })
      },
    },
  },
})
