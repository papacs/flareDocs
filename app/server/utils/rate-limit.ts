import { getHeader, type H3Event } from 'h3'

const LOGIN_LIMIT_WINDOW_MS = 10 * 60 * 1000
const LOGIN_LIMIT_MAX_ATTEMPTS = 12
const loginFailuresByIp = new Map<string, { count: number; resetAt: number }>()

function getClientIp(event: H3Event) {
  const forwarded = getHeader(event, 'cf-connecting-ip') ?? getHeader(event, 'x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? getHeader(event, 'x-real-ip') ?? 'unknown'
}

function cleanupLoginLimit(now: number) {
  for (const [ip, state] of loginFailuresByIp) {
    if (state.resetAt <= now) {
      loginFailuresByIp.delete(ip)
    }
  }
}

export function getLoginLimitStatus(event: H3Event) {
  const now = Date.now()
  cleanupLoginLimit(now)

  const ip = getClientIp(event)
  const state = loginFailuresByIp.get(ip)

  if (!state || state.resetAt <= now) {
    return { limited: false, retryAfterSeconds: 0 }
  }

  if (state.count < LOGIN_LIMIT_MAX_ATTEMPTS) {
    return { limited: false, retryAfterSeconds: 0 }
  }

  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000))
  }
}

export function registerFailedLoginAttempt(event: H3Event) {
  const now = Date.now()
  const ip = getClientIp(event)
  const state = loginFailuresByIp.get(ip)

  if (!state || state.resetAt <= now) {
    loginFailuresByIp.set(ip, {
      count: 1,
      resetAt: now + LOGIN_LIMIT_WINDOW_MS
    })
    return
  }

  loginFailuresByIp.set(ip, {
    count: state.count + 1,
    resetAt: state.resetAt
  })
}

export function clearFailedLoginAttempts(event: H3Event) {
  const ip = getClientIp(event)
  loginFailuresByIp.delete(ip)
}
