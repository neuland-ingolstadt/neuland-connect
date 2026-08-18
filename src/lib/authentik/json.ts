/**
 * Authentik may return Discord/GitHub snowflakes as JSON numbers. JS cannot
 * parse integers above 2^53-1 safely, but the raw JSON text still has the
 * correct digits - quote them before JSON.parse.
 */
const SNOWFLAKE_ATTRIBUTE_KEYS = [
  'discord_role',
  'discord_id',
  'github_id',
] as const

export function patchSnowflakeAttributesInJson(text: string): string {
  let patched = text
  for (const key of SNOWFLAKE_ATTRIBUTE_KEYS) {
    const pattern = new RegExp(`"${key}"\\s*:\\s*(\\d{17,20})`, 'g')
    patched = patched.replace(pattern, `"${key}":"$1"`)
  }
  return patched
}

export function parseAuthentikJson<T>(text: string): T {
  return JSON.parse(patchSnowflakeAttributesInJson(text)) as T
}
