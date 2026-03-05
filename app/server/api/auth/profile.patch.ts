import { eq } from 'drizzle-orm'
import { readBody } from 'h3'

import { users } from '../../../../db/schema'
import { isAvatarPresetId } from '../../../utils/avatar-presets'
import { queueAuditLog } from '../../utils/audit'
import { getAuthenticatedUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { hashPassword, verifyPassword } from '../../utils/password'
import { apiError, ok } from '../../utils/response'

type UpdateProfileBody = {
  avatarId?: string
  currentPassword?: string
  newPassword?: string
}

function isValidPassword(password: string) {
  return password.length >= 8 && password.length <= 128
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event)

  if (!authUser) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  const body = await readBody<UpdateProfileBody>(event)
  const requestedAvatarId = body.avatarId?.trim() ?? ''
  const currentPassword = body.currentPassword ?? ''
  const newPassword = body.newPassword ?? ''
  const shouldChangePassword = currentPassword.length > 0 || newPassword.length > 0

  if (!requestedAvatarId && !shouldChangePassword) {
    return apiError(
      event,
      422,
      'EMPTY_PROFILE_UPDATE',
      'Provide at least one profile field to update.'
    )
  }

  if (requestedAvatarId && !isAvatarPresetId(requestedAvatarId)) {
    return apiError(event, 422, 'INVALID_AVATAR_ID', 'Unsupported avatar preset.')
  }

  if (shouldChangePassword) {
    if (!currentPassword || !newPassword) {
      return apiError(
        event,
        422,
        'PASSWORD_CHANGE_INCOMPLETE',
        'Both currentPassword and newPassword are required to change password.'
      )
    }

    if (!isValidPassword(newPassword)) {
      return apiError(
        event,
        422,
        'INVALID_PASSWORD',
        'Password must be between 8 and 128 characters.'
      )
    }
  }

  const db = getDb(event)
  const [userRow] = await db
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
    .where(eq(users.id, authUser.id))
    .limit(1)

  if (!userRow) {
    return apiError(event, 404, 'USER_NOT_FOUND', 'User account no longer exists.')
  }

  const nextValues: Partial<typeof users.$inferInsert> = {}
  const changedFields: string[] = []

  if (requestedAvatarId && requestedAvatarId !== userRow.avatarId) {
    nextValues.avatarId = requestedAvatarId
    changedFields.push('avatar')
  }

  if (shouldChangePassword) {
    const matches = await verifyPassword(currentPassword, userRow.passwordHash)

    if (!matches) {
      return apiError(event, 401, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect.')
    }

    nextValues.passwordHash = await hashPassword(newPassword)
    changedFields.push('password')
  }

  if (!changedFields.length) {
    return ok({
      user: {
        id: userRow.id,
        username: userRow.username,
        avatarId: userRow.avatarId,
        isSystemAdmin: userRow.isSystemAdmin,
        isActive: userRow.isActive,
        createdAt: userRow.createdAt
      }
    })
  }

  await db.update(users).set(nextValues).where(eq(users.id, userRow.id))
  queueAuditLog(event, {
    action: 'UPDATE_PROFILE',
    userId: userRow.id,
    targetType: 'user',
    targetId: userRow.id,
    meta: {
      changedFields
    }
  })

  const [updatedUser] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userRow.id))
    .limit(1)

  if (!updatedUser) {
    return apiError(event, 500, 'PROFILE_UPDATE_FAILED', 'Unable to load updated profile.')
  }

  return ok({
    user: updatedUser
  })
})
