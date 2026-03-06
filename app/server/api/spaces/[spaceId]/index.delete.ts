import { eq } from 'drizzle-orm'

import { spaces } from '../../../../../db/schema'
import { queueAuditLog } from '../../../utils/audit'
import { getAuthenticatedUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import { getSpaceContext, isPersonalWorkspace, SpaceAccessError } from '../../../utils/spaces'
import { getAssetBucket } from '../../../utils/storage'

type DeleteSpaceBody = {
  confirmName?: string
}

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 422, 'INVALID_SPACE_ID', 'Space id must be a positive integer.')
  }

  const user = await getAuthenticatedUser(event)
  const db = getDb(event)

  let context: Awaited<ReturnType<typeof getSpaceContext>>

  try {
    context = await getSpaceContext(db, spaceId, user?.id)
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_PERMISSION_FAILED', 'Unable to verify space access.')
  }

  if (!user) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  const isCreator = context.space.createdBy === user.id
  const isAdminMember = context.role === 'admin'

  if (!isCreator && !isAdminMember) {
    return apiError(
      event,
      403,
      'INSUFFICIENT_SPACE_ROLE',
      'Only the space creator or a space admin can delete this workspace.'
    )
  }

  if (context.space.visibility === 'public' && !isCreator) {
    return apiError(
      event,
      403,
      'PUBLIC_SPACE_DELETE_CREATOR_ONLY',
      'Public workspaces can only be deleted by their creator.'
    )
  }

  const body = await readBody<DeleteSpaceBody>(event)
  const confirmName = body.confirmName?.trim() ?? ''

  if (!confirmName || confirmName !== context.space.name) {
    return apiError(
      event,
      422,
      'SPACE_DELETE_CONFIRM_MISMATCH',
      'Space name confirmation does not match.'
    )
  }

  try {
    const bucket = getAssetBucket(event)
    let cursor: string | undefined

    for (;;) {
      const listed = await bucket.list({
        prefix: `${spaceId}/`,
        cursor
      })

      if (listed.objects.length > 0) {
        await bucket.delete(listed.objects.map((object) => object.key))
      }

      if (!listed.truncated) {
        break
      }

      cursor = listed.cursor
    }
  } catch {
    // R2 may be unavailable in local/dev environments; workspace deletion should still proceed.
  }

  await db.delete(spaces).where(eq(spaces.id, spaceId))
  queueAuditLog(event, {
    action: 'DELETE_SPACE',
    spaceId,
    userId: user?.id,
    targetType: 'space',
    targetId: spaceId,
    meta: {
      name: context.space.name,
      slug: context.space.slug,
      visibility: context.space.visibility,
      isPersonal: isPersonalWorkspace(context.space, user)
    }
  })

  return ok({
    deleted: true,
    spaceId
  })
})
