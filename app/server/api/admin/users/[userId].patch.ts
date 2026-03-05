import { and, eq, sql } from 'drizzle-orm'
import { readBody } from 'h3'

import { users } from '../../../../../db/schema'
import { queueAuditLog } from '../../../utils/audit'
import { ensureDefaultAdmin } from '../../../utils/bootstrap'
import { getAuthenticatedUser, isSystemAdminUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { hashPassword } from '../../../utils/password'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'

type UpdateUserBody = {
  isActive?: boolean
  isSystemAdmin?: boolean
  newPassword?: string
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

  const userId = getNumericRouteParam(event, 'userId')

  if (!userId) {
    return apiError(event, 422, 'INVALID_USER_ID', 'User id must be a positive integer.')
  }

  const body = await readBody<UpdateUserBody>(event)
  const requestedIsActive = body.isActive
  const requestedIsSystemAdmin = body.isSystemAdmin
  const newPassword = body.newPassword?.trim() ?? ''
  const shouldResetPassword = newPassword.length > 0

  if (
    requestedIsActive === undefined &&
    requestedIsSystemAdmin === undefined &&
    !shouldResetPassword
  ) {
    return apiError(
      event,
      422,
      'EMPTY_USER_UPDATE',
      'Provide at least one field: isActive, isSystemAdmin, or newPassword.'
    )
  }

  if (shouldResetPassword && !isValidPassword(newPassword)) {
    return apiError(
      event,
      422,
      'INVALID_PASSWORD',
      'Password must be between 8 and 128 characters.'
    )
  }

  const db = getDb(event)
  const [targetUser] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!targetUser) {
    return apiError(event, 404, 'USER_NOT_FOUND', 'Target user was not found.')
  }

  const nextIsActive = requestedIsActive ?? targetUser.isActive
  const nextIsSystemAdmin = requestedIsSystemAdmin ?? targetUser.isSystemAdmin

  if (targetUser.id === currentUser.id) {
    if (!nextIsActive) {
      return apiError(event, 409, 'CANNOT_DISABLE_SELF', 'You cannot disable your own account.')
    }

    if (!nextIsSystemAdmin) {
      return apiError(
        event,
        409,
        'CANNOT_DEMOTE_SELF',
        'You cannot remove your own system admin permission.'
      )
    }
  }

  const removingActiveAdmin =
    targetUser.isSystemAdmin &&
    targetUser.isActive &&
    (!nextIsSystemAdmin || !nextIsActive)

  if (removingActiveAdmin) {
    const [adminCountResult] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(and(eq(users.isSystemAdmin, true), eq(users.isActive, true)))

    if (Number(adminCountResult?.count ?? 0) <= 1) {
      return apiError(
        event,
        409,
        'LAST_SYSTEM_ADMIN_REQUIRED',
        'At least one active system admin must remain.'
      )
    }
  }

  const nextValues: Partial<typeof users.$inferInsert> = {}
  const changedFields: string[] = []

  if (requestedIsActive !== undefined && requestedIsActive !== targetUser.isActive) {
    nextValues.isActive = requestedIsActive
    changedFields.push(requestedIsActive ? 'enable' : 'disable')
  }

  if (requestedIsSystemAdmin !== undefined && requestedIsSystemAdmin !== targetUser.isSystemAdmin) {
    nextValues.isSystemAdmin = requestedIsSystemAdmin
    changedFields.push(requestedIsSystemAdmin ? 'grantSystemAdmin' : 'revokeSystemAdmin')
  }

  if (shouldResetPassword) {
    nextValues.passwordHash = await hashPassword(newPassword)
    changedFields.push('resetPassword')
  }

  if (!changedFields.length) {
    return ok({
      user: targetUser
    })
  }

  await db.update(users).set(nextValues).where(eq(users.id, userId))
  queueAuditLog(event, {
    action: 'UPDATE_USER_ACCOUNT',
    userId: currentUser.id,
    targetType: 'user',
    targetId: targetUser.id,
    meta: {
      username: targetUser.username,
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
    .where(eq(users.id, targetUser.id))
    .limit(1)

  if (!updatedUser) {
    return apiError(event, 500, 'UPDATE_USER_FAILED', 'Unable to load the updated user.')
  }

  return ok({
    user: updatedUser
  })
})
