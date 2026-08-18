/** Discord snowflakes are 64-bit IDs; always handle them as strings in JS. */
const DISCORD_SNOWFLAKE_PATTERN = /^\d{17,20}$/

export function isDiscordSnowflake(value: string): boolean {
  return DISCORD_SNOWFLAKE_PATTERN.test(value)
}

export function parseDiscordSnowflakeAttribute(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return isDiscordSnowflake(trimmed) ? trimmed : null
  }

  if (Array.isArray(value) && value.length > 0) {
    return parseDiscordSnowflakeAttribute(value[0])
  }

  return null
}
