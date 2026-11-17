import { describe, expect, test } from 'bun:test'
import {
  isDiscordSnowflake,
  parseDiscordSnowflakeAttribute,
} from '#/lib/integrations/discord/snowflake'

describe('discord snowflake helpers', () => {
  test('accepts typical snowflake lengths', () => {
    expect(isDiscordSnowflake('12345678901234567')).toBe(true)
    expect(isDiscordSnowflake('12345678901234567890')).toBe(true)
  })

  test('rejects non-numeric and wrong-length values', () => {
    expect(isDiscordSnowflake('abc')).toBe(false)
    expect(isDiscordSnowflake('123')).toBe(false)
    expect(isDiscordSnowflake('')).toBe(false)
  })

  test('parses string and first array element', () => {
    expect(parseDiscordSnowflakeAttribute(' 123456789012345678 ')).toBe(
      '123456789012345678',
    )
    expect(parseDiscordSnowflakeAttribute(['123456789012345678', '999'])).toBe(
      '123456789012345678',
    )
    expect(parseDiscordSnowflakeAttribute(['nope'])).toBeNull()
    expect(parseDiscordSnowflakeAttribute(null)).toBeNull()
  })
})
