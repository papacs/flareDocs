import { and, eq } from 'drizzle-orm'

import { spaceMembers } from '../../../../../../db/schema'
import { queueAuditLog } from '../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../utils/auth'
import { getDb } from '../../../../utils/db'
import { getNumericRouteParam } from '../../../../utils/request'
import { apiError, ok } from '../../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../../utils/spaces'

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')
  const userId = getNumericRouteParam(event, 'userId')

  if (!spaceId || !userId) {
    return apiError(event, 422, 'INVALID_ROUTE_PARAMS', 'Space id and user id must be positive integers.')
  }

  const user = await getAuthenticatedUser(event)
  const db = getDb(event)

  try {
    await assertSpaceRole(db, spaceId, user, 'admin')
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_PERMISSION_FAILED', 'Unable to verify permissions.')
  }

  const [existingMembership] = await db
    .select({
      userId: spaceMembers.userId
    })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
    .limit(1)

  if (!existingMembership) {
    return apiError(event, 404, 'MEMBER_NOT_FOUND', 'Space membership was not found.')
  }

  await db
    .delete(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
  queueAuditLog(event, {
    action: 'REMOVE_MEMBER',
    spaceId,
    userId: user?.id,
    targetType: 'space_member',
    targetId: userId
  })

  return ok({
    removed: true,
    userId
  })
})
