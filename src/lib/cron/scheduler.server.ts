import { Cron } from 'croner'
import { notifyTodaysEvents } from '#/lib/integrations/discord/events-notify'
import { reconcileDiscordRoles } from '#/lib/integrations/discord/roles-sync'
import { reconcileGitHubOrgMembership } from '#/lib/integrations/github/sync'
import { reconcileGitHubTeamMembership } from '#/lib/integrations/github/teams-sync'

type CronJob = {
  name: string
  pattern: string
  timezone?: string
  run: () => Promise<void>
}

const JOBS: CronJob[] = [
  {
    name: 'github-org',
    pattern: '*/15 * * * *',
    run: async () => {
      const result = await reconcileGitHubOrgMembership()
      console.log('[cron:github-org] Reconcile completed:', {
        configured: result.configured,
        processed: result.processed,
        members: result.members,
        invited: result.invited,
        skipped: result.skipped,
        errors: result.errors,
      })
    },
  },
  {
    name: 'github-teams',
    pattern: '5,20,35,50 * * * *',
    run: async () => {
      const result = await reconcileGitHubTeamMembership()
      console.log('[cron:github-teams] Reconcile completed:', {
        configured: result.configured,
        teams: result.teams,
        candidates: result.candidates,
        added: result.added,
        removed: result.removed,
        errors: result.errors,
      })
    },
  },
  {
    name: 'discord-roles',
    pattern: '10,25,40,55 * * * *',
    run: async () => {
      const result = await reconcileDiscordRoles()
      console.log('[cron:discord-roles] Reconcile completed:', {
        configured: result.configured,
        candidates: result.candidates,
        members: result.members,
        synced: result.synced,
        skipped: result.skipped,
        errors: result.errors,
      })
    },
  },
  {
    name: 'discord-events',
    pattern: '0 8,11,14,17,20 * * *',
    timezone: 'Europe/Berlin',
    run: async () => {
      const result = await notifyTodaysEvents()
      console.log('[cron:discord-events] Notify completed:', result)
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
  if (inFlight.has(job.name)) {
    console.log(`[cron:${job.name}] Skipped — previous run still in flight`)
    return
  }

  inFlight.add(job.name)
  try {
    await job.run()
  } catch (error) {
    console.error(`[cron:${job.name}] Failed:`, error)
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
    console.log('[cron] INTERNAL_CRON disabled — scheduler not started')
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

  console.log(
    `[cron] Started ${crons.length} jobs: ${JOBS.map(j => j.name).join(', ')}`,
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
