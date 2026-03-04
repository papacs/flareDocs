import { and, eq } from 'drizzle-orm'

import { spaceMembers, users } from '../../../../../../db/schema'
import { queueAuditLog } from '../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../utils/auth'
import { getDb } from '../../../../utils/db'
import { getNumericRouteParam } from '../../../../utils/request'
import { apiError, ok } from '../../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../../utils/spaces'

type AddMemberBody = {
  username?: string
  role?: 'admin' | 'editor' | 'viewer'
}

function isValidRole(value: string): value is 'admin' | 'editor' | 'viewer' {
  return value === 'admin' || value === 'editor' || value === 'viewer'
}

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 422, 'INVALID_SPACE_ID', 'Space id must be a positive integer.')
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

  const body = await readBody<AddMemberBody>(event)
  const username = body.username?.trim().toLowerCase() ?? ''
  const role = body.role ?? 'viewer'

  if (!username) {
    return apiError(event, 422, 'INVALID_USERNAME', 'Username is required.')
  }

  if (!isValidRole(role)) {
    return apiError(event, 422, 'INVALID_ROLE', 'Role must be admin, editor, or viewer.')
  }

  const [targetUser] = await db
    .select({
      id: users.id,
      username: users.username
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!targetUser) {
    return apiError(event, 404, 'USER_NOT_FOUND', 'Target user was not found.')
  }

  const [existingMembership] = await db
    .select({
      userId: spaceMembers.userId
    })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, targetUser.id)))
    .limit(1)

  if (existingMembership) {
    return apiError(event, 409, 'MEMBER_EXISTS', 'User is already a member of this space.')
  }

  await db.insert(spaceMembers).values({
    spaceId,
    userId: targetUser.id,
    roleInSpace: role
  })
  queueAuditLog(event, {
    action: 'ADD_MEMBER',
    spaceId,
    userId: user?.id,
    targetType: 'space_member',
    targetId: targetUser.id,
    meta: {
      username: targetUser.username,
      role
    }
  })

  return ok({
    member: {
      userId: targetUser.id,
      username: targetUser.username,
      role
    }
  })
})
