import { listGuildRoles } from '#/lib/integrations/discord/guild'

const EVERYONE_ROLE_NAME = '@everyone'

function padEnd(value: string, length: number): string {
  if (value.length >= length) {
    return value
  }

  return value + ' '.repeat(length - value.length)
}

/**
 * Prints guild roles and snowflake IDs to the server log so admins can copy
 * them into Authentik group attributes (`discord_role`).
 */
export async function logGuildRolesForAuthentikSetup(): Promise<void> {
  const roles = await listGuildRoles()
  const assignable = roles.filter(role => role.name !== EVERYONE_ROLE_NAME)

  if (assignable.length === 0) {
    console.log('[discord-bot] No assignable guild roles found')
    return
  }

  const nameWidth = Math.max(
    'Role name'.length,
    ...assignable.map(role => role.name.length),
  )

  const lines = [
    '[discord-bot] Discord guild roles - copy IDs into Authentik group attributes:',
    '',
    `  ${padEnd('Role name', nameWidth)}  Role ID`,
    `  ${'-'.repeat(nameWidth)}  ${'-'.repeat(19)}`,
  ]

  for (const role of assignable) {
    const suffix = role.managed ? ' (managed)' : ''
    lines.push(`  ${padEnd(role.name, nameWidth)}  ${role.id}${suffix}`)
  }

  lines.push(
    '',
    '  Authentik group attribute example:',
    '  { "discord_role": "<Role ID>" }',
    '',
  )

  console.log(lines.join('\n'))
}
