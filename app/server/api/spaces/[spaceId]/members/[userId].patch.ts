import { and, eq, sql } from 'drizzle-orm'

import { spaceMembers } from '../../../../../../db/schema'
import { queueAuditLog } from '../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../utils/auth'
import { getDb } from '../../../../utils/db'
import { getNumericRouteParam } from '../../../../utils/request'
import { apiError, ok } from '../../../../utils/response'
import { assertSpaceRole, isPersonalWorkspace, SpaceAccessError } from '../../../../utils/spaces'

type UpdateMemberBody = {
  role?: 'admin' | 'editor' | 'viewer'
}

function isValidRole(value: string): value is 'admin' | 'editor' | 'viewer' {
  return value === 'admin' || value === 'editor' || value === 'viewer'
}

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')
  const userId = getNumericRouteParam(event, 'userId')

  if (!spaceId || !userId) {
    return apiError(event, 422, 'INVALID_ROUTE_PARAMS', 'Space id and user id must be positive integers.')
  }

  const user = await getAuthenticatedUser(event)
  const db = getDb(event)
  let space: {
    id: number
    name: string
    slug: string
    visibility: 'private' | 'team' | 'public'
    createdBy: number | null
    createdAt: number
  } | null = null

  try {
    const context = await assertSpaceRole(db, spaceId, user, 'admin')
    space = context.space
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_PERMISSION_FAILED', 'Unable to verify permissions.')
  }

  if (space && isPersonalWorkspace(space, user)) {
    return apiError(
      event,
      403,
      'PERSONAL_SPACE_MEMBERS_LOCKED',
      'Personal workspaces do not support member sharing.'
    )
  }

  const body = await readBody<UpdateMemberBody>(event)
  const role = body.role ?? ''

  if (!isValidRole(role)) {
    return apiError(event, 422, 'INVALID_ROLE', 'Role must be admin, editor, or viewer.')
  }

  const [existingMembership] = await db
    .select({
      userId: spaceMembers.userId,
      role: spaceMembers.roleInSpace
    })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
    .limit(1)

  if (!existingMembership) {
    return apiError(event, 404, 'MEMBER_NOT_FOUND', 'Space membership was not found.')
  }

  if (existingMembership.role === 'admin' && role !== 'admin') {
    const [adminCountResult] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.roleInSpace, 'admin')))

    if (Number(adminCountResult?.count ?? 0) <= 1) {
      return apiError(
        event,
        409,
        'LAST_ADMIN_REQUIRED',
        'At least one admin must remain in the space.'
      )
    }
  }

  await db
    .update(spaceMembers)
    .set({ roleInSpace: role })
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
  queueAuditLog(event, {
    action: 'UPDATE_MEMBER_ROLE',
    spaceId,
    userId: user?.id,
    targetType: 'space_member',
    targetId: userId,
    meta: {
      role
    }
  })

  return ok({
    member: {
      userId,
      role
    }
  })
})
