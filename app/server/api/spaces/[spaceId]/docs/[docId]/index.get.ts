import { eq } from 'drizzle-orm'

import { users } from '../../../../../../../db/schema'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import { getDb } from '../../../../../utils/db'
import { getSpaceDocument } from '../../../../../utils/documents'
import { getNumericRouteParam } from '../../../../../utils/request'
import { apiError, ok } from '../../../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../../../utils/spaces'

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')
  const docId = getNumericRouteParam(event, 'docId')

  if (!spaceId || !docId) {
    return apiError(
      event,
      422,
      'INVALID_ROUTE_PARAMS',
      'Space id and document id must be positive integers.'
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

  const document = await getSpaceDocument(db, spaceId, docId)

  if (!document) {
    return apiError(event, 404, 'DOCUMENT_NOT_FOUND', 'Document was not found.')
  }

  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (document.createdBy) {
    const [createdByUser] = await db
      .select({
        username: users.username
      })
      .from(users)
      .where(eq(users.id, document.createdBy))
      .limit(1)

    createdByName = createdByUser?.username ?? null
  }

  if (document.updatedBy) {
    const [updatedByUser] = await db
      .select({
        username: users.username
      })
      .from(users)
      .where(eq(users.id, document.updatedBy))
      .limit(1)

    updatedByName = updatedByUser?.username ?? null
  }

  return ok({
    document: {
      id: document.id,
      title: document.title,
      content: document.content,
      parentId: document.parentId,
      isFolder: document.isFolder,
      version: document.version,
      createdAt: document.createdAt,
      createdByName,
      updatedAt: document.updatedAt,
      updatedByName
    }
  })
})
