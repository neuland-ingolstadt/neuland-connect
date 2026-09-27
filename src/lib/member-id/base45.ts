/** Base45 charset per RFC 9285 / EU DCC. */
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

function divmod(x: number, y: number): [number, number] {
  return [Math.floor(x / y), x % y]
}

/**
 * Decode a base45 string to bytes without Node `Buffer`
 * (the `base45` npm package returns Buffer and breaks in the browser).
 */
export function decodeBase45(input: string): Uint8Array {
  const values = Array.from(input).map(c => {
    const idx = CHARSET.indexOf(c)
    if (idx < 0) {
      throw new Error(`Invalid base45 character: ${c}`)
    }
    return idx
  })

  const out: number[] = []
  for (let i = 0; i < values.length; i += 3) {
    if (values.length - i >= 3) {
      const x = values[i] + values[i + 1] * 45 + values[i + 2] * 45 * 45
      if (x > 0xffff) {
        throw new Error('Invalid base45 string')
      }
      out.push(...divmod(x, 256))
    } else if (values.length - i === 2) {
      const x = values[i] + values[i + 1] * 45
      if (x > 0xff) {
        throw new Error('Invalid base45 string')
      }
      out.push(x)
    } else {
      throw new Error('Invalid base45 string length')
    }
  }

  return Uint8Array.from(out)
}
