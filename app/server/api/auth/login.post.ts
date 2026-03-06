import { eq } from 'drizzle-orm'
import { readBody, setCookie, setHeader } from 'h3'

import { users } from '../../../../db/schema'
import { ensureDefaultAdmin } from '../../utils/bootstrap'
import { queueAuditLog } from '../../utils/audit'
import { getAuthCookieOptions, issueAuthToken } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { verifyPassword } from '../../utils/password'
import { apiError, ok } from '../../utils/response'
import { ensurePersonalWorkspace } from '../../utils/spaces'
import { verifyCaptchaChallenge } from '../../utils/captcha'
import {
  clearFailedLoginAttempts,
  getLoginLimitStatus,
  registerFailedLoginAttempt
} from '../../utils/rate-limit'

type LoginBody = {
  username?: string
  password?: string
  captchaToken?: string
  captchaCode?: string
}

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin(event)

  const loginLimit = getLoginLimitStatus(event)

  if (loginLimit.limited) {
    setHeader(event, 'Retry-After', String(loginLimit.retryAfterSeconds))
    return apiError(
      event,
      429,
      'TOO_MANY_LOGIN_ATTEMPTS',
      'Too many failed login attempts. Please try again later.'
    )
  }

  const rejectLogin = (statusCode: number, code: string, message: string) => {
    registerFailedLoginAttempt(event)
    return apiError(event, statusCode, code, message)
  }

  const body = await readBody<LoginBody>(event)
  const username = body.username?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''
  const captchaToken = body.captchaToken?.trim() ?? ''
  const captchaCode = body.captchaCode?.trim() ?? ''

  if (!username || !password) {
    return rejectLogin(422, 'INVALID_CREDENTIALS', 'Username and password are required.')
  }

  if (!captchaToken || !captchaCode) {
    return rejectLogin(422, 'CAPTCHA_REQUIRED', 'Captcha token and code are required.')
  }

  const captchaValid = await verifyCaptchaChallenge(event, captchaToken, captchaCode)

  if (!captchaValid) {
    return rejectLogin(422, 'CAPTCHA_INVALID', 'Captcha validation failed.')
  }

  const db = getDb(event)
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user) {
    return rejectLogin(401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  if (!user.isActive) {
    return rejectLogin(401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash)

  if (!passwordMatches) {
    return rejectLogin(401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  await ensurePersonalWorkspace(db, user)
  clearFailedLoginAttempts(event)

  const token = await issueAuthToken(event, {
    userId: user.id,
    username: user.username
  })

  setCookie(event, 'fd_session', token, getAuthCookieOptions(event))
  queueAuditLog(event, {
    action: 'LOGIN',
    userId: user.id,
    targetType: 'user',
    targetId: user.id
  })

  return ok({
    user: {
      id: user.id,
      username: user.username,
      avatarId: user.avatarId,
      isSystemAdmin: user.isSystemAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  })
})
