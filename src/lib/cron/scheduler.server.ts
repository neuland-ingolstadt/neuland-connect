import { Cron } from 'croner'
import type { Logger } from 'pino'
import { notifyTodaysEvents } from '#/lib/integrations/discord/events-notify'
import { reconcileDiscordRoles } from '#/lib/integrations/discord/roles-sync'
import { reconcileGitHubOrgMembership } from '#/lib/integrations/github/sync'
import { reconcileGitHubTeamMembership } from '#/lib/integrations/github/teams-sync'
import { createLogger } from '#/lib/logger.server'

const log = createLogger('cron')

type CronJob = {
  name: string
  pattern: string
  timezone?: string
  run: (jobLog: Logger) => Promise<void>
}

const JOBS: CronJob[] = [
  {
    name: 'github-org',
    pattern: '*/15 * * * *',
    run: async jobLog => {
      const result = await reconcileGitHubOrgMembership()
      jobLog.info(
        {
          configured: result.configured,
          processed: result.processed,
          members: result.members,
          invited: result.invited,
          skipped: result.skipped,
          errors: result.errors,
        },
        'Reconcile completed',
      )
    },
  },
  {
    name: 'github-teams',
    pattern: '5,20,35,50 * * * *',
    run: async jobLog => {
      const result = await reconcileGitHubTeamMembership()
      jobLog.info(
        {
          configured: result.configured,
          teams: result.teams,
          candidates: result.candidates,
          added: result.added,
          removed: result.removed,
          errors: result.errors,
        },
        'Reconcile completed',
      )
    },
  },
  {
    name: 'discord-roles',
    pattern: '10,25,40,55 * * * *',
    run: async jobLog => {
      const result = await reconcileDiscordRoles()
      jobLog.info(
        {
          configured: result.configured,
          candidates: result.candidates,
          members: result.members,
          synced: result.synced,
          skipped: result.skipped,
          errors: result.errors,
        },
        'Reconcile completed',
      )
    },
  },
  {
    name: 'discord-events',
    pattern: '0 8,11,14,17,20 * * *',
    timezone: 'Europe/Berlin',
    run: async jobLog => {
      const result = await notifyTodaysEvents()
      jobLog.info({ result }, 'Notify completed')
    },
  },
]

let started = false
const crons: Cron[] = []
const inFlight = new Set<string>()

function isInternalCronEnabled(): boolean {
  const flag = process.env.INTERNAL_CRON?.trim().toLowerCase()
  if (flag === 'false' || flag === '0' || flag === 'off') {
    return false
  }

  return true
}

async function runJob(job: CronJob): Promise<void> {
  const jobLog = log.child({ job: job.name })

  if (inFlight.has(job.name)) {
    jobLog.info('Skipped — previous run still in flight')
    return
  }

  inFlight.add(job.name)
  try {
    await job.run(jobLog)
  } catch (error) {
    jobLog.error({ err: error }, 'Failed')
  } finally {
    inFlight.delete(job.name)
  }
}

export function startInternalCron(): void {
  if (started) {
    return
  }

  started = true

  if (!isInternalCronEnabled()) {
    log.info('INTERNAL_CRON disabled — scheduler not started')
    return
  }

  for (const job of JOBS) {
    const cron = new Cron(
      job.pattern,
      {
        name: job.name,
        timezone: job.timezone,
        protect: true,
      },
      () => {
        void runJob(job)
      },
    )
    crons.push(cron)
  }

  log.info(
    { jobs: JOBS.map(j => j.name), count: crons.length },
    'Scheduler started',
  )
}

export function stopInternalCron(): void {
  for (const cron of crons) {
    cron.stop()
  }
  crons.length = 0
  inFlight.clear()
  started = false
}
