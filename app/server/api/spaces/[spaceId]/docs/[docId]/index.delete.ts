import { and, eq } from 'drizzle-orm'

import { documents } from '../../../../../../../db/schema'
import { queueAuditLog } from '../../../../../utils/audit'
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
    return apiError(event, 422, 'INVALID_ROUTE_PARAMS', 'Space id and document id must be positive integers.')
  }

  const user = await getAuthenticatedUser(event)
  const db = getDb(event)

  try {
    await assertSpaceRole(db, spaceId, user, 'editor')
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_PERMISSION_FAILED', 'Unable to verify space access.')
  }

  const existingDocument = await getSpaceDocument(db, spaceId, docId)

  if (!existingDocument) {
    return apiError(event, 404, 'DOCUMENT_NOT_FOUND', 'Document was not found.')
  }

  await db.delete(documents).where(and(eq(documents.spaceId, spaceId), eq(documents.id, docId)))
  queueAuditLog(event, {
    action: 'DELETE_DOC',
    spaceId,
    userId: user?.id,
    targetType: 'document',
    targetId: docId,
    meta: {
      title: existingDocument.title,
      isFolder: existingDocument.isFolder,
      parentId: existingDocument.parentId
    }
  })

  return ok({
    deleted: true,
    documentId: docId
  })
})
