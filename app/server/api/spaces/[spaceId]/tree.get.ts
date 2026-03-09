import { and, asc, eq, isNull } from 'drizzle-orm'
import { getQuery } from 'h3'

import { documents } from '../../../../../db/schema'
import { getAuthenticatedUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../utils/spaces'

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')
  const query = getQuery(event)
  const all =
    query.all === '1' ||
    query.all === 'true' ||
    query.all === 1 ||
    query.all === true
  const parentIdRaw = Array.isArray(query.parentId)
    ? query.parentId[0]
    : query.parentId
  const parentId =
    parentIdRaw === undefined || parentIdRaw === null || parentIdRaw === ''
      ? null
      : Number(parentIdRaw)

  if (!spaceId) {
    return apiError(
      event,
      422,
      'INVALID_SPACE_ID',
      'Space id must be a positive integer.'
    )
  }

  if (
    !all &&
    parentId !== null &&
    (!Number.isInteger(parentId) || parentId <= 0)
  ) {
    return apiError(
      event,
      422,
      'INVALID_PARENT_ID',
      'Parent id must be a positive integer.'
    )
  }

  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  try {
    await assertSpaceRole(db, spaceId, user, 'viewer')
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

  const tree = await db
    .select({
      id: documents.id,
      title: documents.title,
      parentId: documents.parentId,
      isFolder: documents.isFolder,
      version: documents.version,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .where(
      all
        ? eq(documents.spaceId, spaceId)
        : parentId === null
          ? and(eq(documents.spaceId, spaceId), isNull(documents.parentId))
          : and(
              eq(documents.spaceId, spaceId),
              eq(documents.parentId, parentId)
            )
    )
    .orderBy(
      asc(documents.parentId),
      asc(documents.isFolder),
      asc(documents.title)
    )

  return ok({
    documents: tree
  })
})
