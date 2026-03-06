import { SignJWT, jwtVerify } from 'jose'
import { type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

const CAPTCHA_EXPIRATION_SECONDS = 300
const USED_CHALLENGE_TTL_MS = CAPTCHA_EXPIRATION_SECONDS * 1000

type CaptchaOperator = '+' | '-' | '*' | '/'

type CaptchaTokenPayload = {
  type: 'captcha'
  nonce: string
  answerHash: string
  challengeId: string
}

const usedCaptchaChallenges = new Map<string, number>()

function getCaptchaSecret(event: H3Event) {
  const rawSecret = useRuntimeConfig(event).authSecret
  const secret =
    typeof rawSecret === 'string'
      ? rawSecret
      : rawSecret === null || rawSecret === undefined
        ? ''
        : String(rawSecret)

  if (!secret) {
    throw new Error('Missing runtime config `authSecret`.')
  }

  return new TextEncoder().encode(secret)
}

function getCaptchaSecretText(event: H3Event) {
  const rawSecret = useRuntimeConfig(event).authSecret
  const secret =
    typeof rawSecret === 'string'
      ? rawSecret
      : rawSecret === null || rawSecret === undefined
        ? ''
        : String(rawSecret)

  if (!secret) {
    throw new Error('Missing runtime config `authSecret`.')
  }

  return secret
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function normalizeCaptchaInput(value: string) {
  return value.trim().replace(/\s+/g, '')
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function buildCaptchaAnswerHash(event: H3Event, nonce: string, answer: string) {
  const payload = `${nonce}:${normalizeCaptchaInput(answer)}:${getCaptchaSecretText(event)}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return base64UrlEncode(new Uint8Array(digest))
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let diff = 0

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return diff === 0
}

function cleanupUsedChallenges(now: number) {
  for (const [challengeId, expiresAt] of usedCaptchaChallenges) {
    if (expiresAt <= now) {
      usedCaptchaChallenges.delete(challengeId)
    }
  }
}

function generateExpression() {
  const operators: CaptchaOperator[] = ['+', '-', '*', '/']
  const operator = operators[randomInt(0, operators.length - 1)]

  if (operator === '+') {
    const left = randomInt(2, 19)
    const right = randomInt(1, 9)
    return {
      expressionText: `${left} + ${right} = ?`,
      answer: String(left + right)
    }
  }

  if (operator === '-') {
    const right = randomInt(1, 9)
    const left = randomInt(right + 1, 22)
    return {
      expressionText: `${left} - ${right} = ?`,
      answer: String(left - right)
    }
  }

  if (operator === '*') {
    const left = randomInt(2, 9)
    const right = randomInt(2, 9)
    return {
      expressionText: `${left} × ${right} = ?`,
      answer: String(left * right)
    }
  }

  const divisor = randomInt(2, 9)
  const quotient = randomInt(2, 9)
  const dividend = divisor * quotient
  return {
    expressionText: `${dividend} ÷ ${divisor} = ?`,
    answer: String(quotient)
  }
}

function randomColorWithAlpha() {
  const palette = [
    'rgba(15,23,42,0.24)',
    'rgba(2,132,199,0.24)',
    'rgba(180,83,9,0.25)',
    'rgba(148,163,184,0.26)'
  ]

  return palette[randomInt(0, palette.length - 1)]
}

function renderCaptchaSvg(expressionText: string) {
  const width = 180
  const height = 54
  const lines = Array.from({ length: 6 }).map(() => {
    const x1 = randomInt(0, width - 1)
    const y1 = randomInt(2, height - 2)
    const x2 = randomInt(0, width - 1)
    const y2 = randomInt(2, height - 2)
    const strokeWidth = (Math.random() * 1.5 + 0.7).toFixed(2)

    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${randomColorWithAlpha()}" stroke-width="${strokeWidth}" />`
  })

  const dots = Array.from({ length: 24 }).map(() => {
    const cx = randomInt(3, width - 3)
    const cy = randomInt(3, height - 3)
    const r = (Math.random() * 1.4 + 0.4).toFixed(2)

    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${randomColorWithAlpha()}" />`
  })

  const chars = expressionText.split('')
  const renderedChars = chars
    .map((char, index) => {
      const x = 18 + index * 16 + randomInt(-2, 2)
      const y = 34 + randomInt(-2, 2)
      const rotate = randomInt(-16, 16)

      return `<text x="${x}" y="${y}" transform="rotate(${rotate} ${x} ${y})" fill="rgba(15,23,42,0.92)" font-size="24" font-family="ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif" font-weight="700">${char}</text>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="captcha"><rect width="${width}" height="${height}" rx="12" fill="rgba(255,251,245,0.98)" />${lines.join('')}${dots.join('')}${renderedChars}</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export async function issueCaptchaChallenge(event: H3Event) {
  cleanupUsedChallenges(Date.now())
  const expression = generateExpression()
  const nonce = crypto.randomUUID()
  const challengeId = crypto.randomUUID()
  const answerHash = await buildCaptchaAnswerHash(event, nonce, expression.answer)
  const tokenPayload: CaptchaTokenPayload = {
    type: 'captcha',
    nonce,
    answerHash,
    challengeId
  }

  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${CAPTCHA_EXPIRATION_SECONDS}s`)
    .sign(getCaptchaSecret(event))

  return {
    token,
    imageDataUrl: renderCaptchaSvg(expression.expressionText),
    expiresInSeconds: CAPTCHA_EXPIRATION_SECONDS
  }
}

export async function verifyCaptchaChallenge(event: H3Event, token: string, input: string) {
  try {
    cleanupUsedChallenges(Date.now())
    const { payload } = await jwtVerify<CaptchaTokenPayload>(token, getCaptchaSecret(event), {
      algorithms: ['HS256']
    })

    if (
      payload.type !== 'captcha' ||
      typeof payload.nonce !== 'string' ||
      typeof payload.answerHash !== 'string' ||
      typeof payload.challengeId !== 'string'
    ) {
      return false
    }

    if (usedCaptchaChallenges.has(payload.challengeId)) {
      return false
    }

    usedCaptchaChallenges.set(payload.challengeId, Date.now() + USED_CHALLENGE_TTL_MS)

    const actualAnswerHash = await buildCaptchaAnswerHash(event, payload.nonce, input)
    return timingSafeEqual(payload.answerHash, actualAnswerHash)
  } catch {
    return false
  }
}
