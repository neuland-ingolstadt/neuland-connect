import { listGuildRoles } from '#/lib/integrations/discord/guild'
import { createLogger } from '#/lib/logger.server'

const log = createLogger('discord-bot')

const EVERYONE_ROLE_NAME = '@everyone'

/**
 * Logs guild roles and snowflake IDs so admins can copy them into Authentik
 * group attributes (`discord_role`).
 */
export async function logGuildRolesForAuthentikSetup(): Promise<void> {
  const roles = await listGuildRoles()
  const assignable = roles.filter(role => role.name !== EVERYONE_ROLE_NAME)

  if (assignable.length === 0) {
    log.info('No assignable guild roles found')
    return
  }

  log.info(
    {
      roles: assignable.map(role => ({
        name: role.name,
        id: role.id,
        managed: role.managed,
      })),
    },
    'Discord guild roles — copy IDs into Authentik group attributes (discord_role)',
  )
}
