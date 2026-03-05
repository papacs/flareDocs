import { eq } from 'drizzle-orm'
import { readBody, setResponseStatus } from 'h3'

import { users } from '../../../../../db/schema'
import { isAvatarPresetId } from '../../../../utils/avatar-presets'
import { queueAuditLog } from '../../../utils/audit'
import { ensureDefaultAdmin } from '../../../utils/bootstrap'
import { getAuthenticatedUser, isSystemAdminUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { hashPassword } from '../../../utils/password'
import { apiError, ok } from '../../../utils/response'
import { ensurePersonalWorkspace } from '../../../utils/spaces'

type CreateUserBody = {
  username?: string
  password?: string
  avatarId?: string
  isSystemAdmin?: boolean
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

  const currentUser = await getAuthenticatedUser(event)

  if (!currentUser) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  if (!isSystemAdminUser(currentUser)) {
    return apiError(event, 403, 'SYSTEM_ADMIN_REQUIRED', 'Only system administrators can manage users.')
  }

  const body = await readBody<CreateUserBody>(event)
  const username = body.username ? normalizeUsername(body.username) : ''
  const password = body.password ?? ''
  const avatarId = body.avatarId?.trim() ?? 'qq-classic-01'
  const nextIsSystemAdmin = body.isSystemAdmin === true

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

  if (!isAvatarPresetId(avatarId)) {
    return apiError(event, 422, 'INVALID_AVATAR_ID', 'Unsupported avatar preset.')
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
  const [createdUser] = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      avatarId,
      isSystemAdmin: nextIsSystemAdmin,
      isActive: true
    })
    .returning({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt
    })

  if (!createdUser) {
    return apiError(event, 500, 'CREATE_USER_FAILED', 'Unable to create user.')
  }

  await ensurePersonalWorkspace(db, createdUser)
  queueAuditLog(event, {
    action: 'CREATE_USER',
    userId: currentUser.id,
    targetType: 'user',
    targetId: createdUser.id,
    meta: {
      username: createdUser.username,
      isSystemAdmin: createdUser.isSystemAdmin
    }
  })

  setResponseStatus(event, 201)

  return ok({
    user: createdUser
  })
})
