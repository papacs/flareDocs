const HASH_PREFIX = 'pbkdf2_sha256'
const HASH_ITERATIONS = 100_000
const SALT_BYTES = 16
const KEY_LENGTH = 32

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function toSafeBytes(bytes: Uint8Array) {
  const safeBytes = new Uint8Array(bytes.byteLength)
  safeBytes.set(bytes)
  return safeBytes
}

async function derivePasswordBits(password: string, salt: Uint8Array, iterations: number) {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toSafeBytes(salt),
      iterations
    },
    passwordKey,
    KEY_LENGTH * 8
  )

  return new Uint8Array(derivedBits)
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false
  }

  let result = 0

  for (let index = 0; index < left.length; index += 1) {
    result |= (left[index] ?? 0) ^ (right[index] ?? 0)
  }

  return result === 0
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const derived = await derivePasswordBits(password, salt, HASH_ITERATIONS)

  return [
    HASH_PREFIX,
    String(HASH_ITERATIONS),
    bytesToBase64Url(salt),
    bytesToBase64Url(derived)
  ].join('$')
}

export async function verifyPassword(password: string, storedHash: string) {
  try {
    const [algorithm, iterationsRaw, saltRaw, digestRaw] = storedHash.split('$')

    if (!algorithm || !iterationsRaw || !saltRaw || !digestRaw) {
      return false
    }

    if (algorithm !== HASH_PREFIX) {
      return false
    }

    const iterations = Number(iterationsRaw)

    if (!Number.isInteger(iterations) || iterations <= 0 || iterations > 100_000) {
      return false
    }

    const salt = base64UrlToBytes(saltRaw)
    const expectedDigest = base64UrlToBytes(digestRaw)
    const actualDigest = await derivePasswordBits(password, salt, iterations)

    return timingSafeEqual(actualDigest, expectedDigest)
  } catch {
    return false
  }
}
