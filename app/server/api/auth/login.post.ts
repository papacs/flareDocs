import { eq } from 'drizzle-orm'
import { readBody, setCookie } from 'h3'

import { users } from '../../../../db/schema'
import { ensureDefaultAdmin } from '../../utils/bootstrap'
import { queueAuditLog } from '../../utils/audit'
import { getAuthCookieOptions, issueAuthToken } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { verifyPassword } from '../../utils/password'
import { apiError, ok } from '../../utils/response'
import { ensurePersonalWorkspace } from '../../utils/spaces'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin(event)

  const body = await readBody<LoginBody>(event)
  const username = body.username?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''

  if (!username || !password) {
    return apiError(event, 422, 'INVALID_CREDENTIALS', 'Username and password are required.')
  }

  const db = getDb(event)
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user) {
    return apiError(event, 401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash)

  if (!passwordMatches) {
    return apiError(event, 401, 'INVALID_CREDENTIALS', 'Invalid username or password.')
  }

  await ensurePersonalWorkspace(db, {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  })

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
      createdAt: user.createdAt
    }
  })
})
