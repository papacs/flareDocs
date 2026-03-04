import { eq } from 'drizzle-orm'
import { readBody, setCookie } from 'h3'

import { users } from '../../../../db/schema'
import { ensureDefaultAdmin } from '../../utils/bootstrap'
import { issueAuthToken, getAuthCookieOptions } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/password'
import { apiError, ok } from '../../utils/response'
import { ensurePersonalWorkspace } from '../../utils/spaces'

type RegisterBody = {
  username?: string
  password?: string
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function isValidUsername(username: string) {
  return /^[a-z0-9_-]{3,32}$/.test(username)
}

function isValidPassword(password: string) {
  return password.length >= 8 && password.length <= 128
}

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin(event)

  const body = await readBody<RegisterBody>(event)
  const username = body.username ? normalizeUsername(body.username) : ''
  const password = body.password ?? ''

  if (!isValidUsername(username)) {
    return apiError(
      event,
      422,
      'INVALID_USERNAME',
      'Username must be 3-32 chars and contain only lowercase letters, numbers, underscores, or hyphens.'
    )
  }

  if (!isValidPassword(password)) {
    return apiError(
      event,
      422,
      'INVALID_PASSWORD',
      'Password must be between 8 and 128 characters.'
    )
  }

  const db = getDb(event)
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (existingUser) {
    return apiError(event, 409, 'USERNAME_TAKEN', 'Username is already in use.')
  }

  const passwordHash = await hashPassword(password)
  const insertResult = await db.insert(users).values({ username, passwordHash }).returning({
    id: users.id,
    username: users.username,
    createdAt: users.createdAt
  })
  const createdUser = insertResult[0]

  if (!createdUser) {
    return apiError(event, 500, 'REGISTER_FAILED', 'Unable to create user.')
  }

  await ensurePersonalWorkspace(db, createdUser)

  const token = await issueAuthToken(event, {
    userId: createdUser.id,
    username: createdUser.username
  })

  setCookie(event, 'fd_session', token, getAuthCookieOptions(event))

  return ok({
    user: createdUser
  })
})
