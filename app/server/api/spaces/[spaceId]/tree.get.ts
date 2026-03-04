import { asc, eq } from 'drizzle-orm'

import { documents } from '../../../../../db/schema'
import { getAuthenticatedUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../utils/spaces'

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 422, 'INVALID_SPACE_ID', 'Space id must be a positive integer.')
  }

  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  try {
    await assertSpaceRole(db, spaceId, user, 'viewer')
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_PERMISSION_FAILED', 'Unable to verify space access.')
  }

  const tree = await db
    .select({
      id: documents.id,
      title: documents.title,
      parentId: documents.parentId,
      isFolder: documents.isFolder,
      version: documents.version,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .where(eq(documents.spaceId, spaceId))
    .orderBy(asc(documents.parentId), asc(documents.isFolder), asc(documents.title))

  return ok({
    documents: tree
  })
})
