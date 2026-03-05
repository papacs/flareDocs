import { and, eq, sql } from 'drizzle-orm'

import { users } from '../../../../../db/schema'
import { queueAuditLog } from '../../../utils/audit'
import { ensureDefaultAdmin } from '../../../utils/bootstrap'
import { getAuthenticatedUser, isSystemAdminUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'

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

  if (userId === currentUser.id) {
    return apiError(event, 409, 'CANNOT_DELETE_SELF', 'You cannot delete your own account.')
  }

  const db = getDb(event)
  const [targetUser] = await db
    .select({
      id: users.id,
      username: users.username,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!targetUser) {
    return apiError(event, 404, 'USER_NOT_FOUND', 'Target user was not found.')
  }

  if (targetUser.isSystemAdmin && targetUser.isActive) {
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

  await db.delete(users).where(eq(users.id, targetUser.id))
  queueAuditLog(event, {
    action: 'DELETE_USER',
    userId: currentUser.id,
    targetType: 'user',
    targetId: targetUser.id,
    meta: {
      username: targetUser.username
    }
  })

  return ok({
    deleted: true,
    userId: targetUser.id
  })
})
