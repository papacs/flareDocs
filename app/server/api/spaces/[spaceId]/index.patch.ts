import { eq } from 'drizzle-orm'

import { spaces } from '../../../../../db/schema'
import { queueAuditLog } from '../../../utils/audit'
import { getAuthenticatedUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import {
  getSpaceContext,
  isPersonalWorkspace,
  SpaceAccessError
} from '../../../utils/spaces'

type UpdateSpaceBody = {
  name?: string
}

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(
      event,
      422,
      'INVALID_SPACE_ID',
      'Space id must be a positive integer.'
    )
  }

  const user = await getAuthenticatedUser(event)

  if (!user) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  const db = getDb(event)
  let context: Awaited<ReturnType<typeof getSpaceContext>>

  try {
    context = await getSpaceContext(db, spaceId, user.id)
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(
      event,
      500,
      'SPACE_PERMISSION_FAILED',
      'Unable to verify space access.'
    )
  }

  const isCreator = context.space.createdBy === user.id
  const isAdminMember = context.role === 'admin'

  if (!isCreator && !isAdminMember) {
    return apiError(
      event,
      403,
      'INSUFFICIENT_SPACE_ROLE',
      'Only the space creator or a space admin can update this workspace.'
    )
  }

  if (context.space.visibility === 'public' && !isCreator) {
    return apiError(
      event,
      403,
      'PUBLIC_SPACE_UPDATE_CREATOR_ONLY',
      'Public workspaces can only be updated by their creator.'
    )
  }

  const body = await readBody<UpdateSpaceBody>(event)
  const nextName = body.name?.trim() ?? ''

  if (nextName.length < 2 || nextName.length > 64) {
    return apiError(
      event,
      422,
      'INVALID_SPACE_NAME',
      'Space name must be between 2 and 64 characters.'
    )
  }

  await db
    .update(spaces)
    .set({
      name: nextName
    })
    .where(eq(spaces.id, spaceId))

  queueAuditLog(event, {
    action: 'UPDATE_SPACE',
    spaceId,
    userId: user.id,
    targetType: 'space',
    targetId: spaceId,
    meta: {
      previousName: context.space.name,
      name: nextName,
      visibility: context.space.visibility,
      isPersonal: isPersonalWorkspace(context.space, user)
    }
  })

  return ok({
    space: {
      ...context.space,
      name: nextName,
      isPersonal: isPersonalWorkspace(context.space, user),
      myRole: context.role
    }
  })
})
