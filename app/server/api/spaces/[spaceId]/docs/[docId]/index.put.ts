import { and, eq, sql } from 'drizzle-orm'

import { documents } from '../../../../../../../db/schema'
import { queueAuditLog } from '../../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import { getDb } from '../../../../../utils/db'
import {
  createsDocumentCycle,
  ensureParentFolder,
  getSpaceDocument
} from '../../../../../utils/documents'
import { getNumericRouteParam } from '../../../../../utils/request'
import { apiError, ok } from '../../../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../../../utils/spaces'

type UpdateDocumentBody = {
  title?: string
  content?: string
  parentId?: number | null
  version?: number
}

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

  const body = await readBody<UpdateDocumentBody>(event)

  if (!Number.isInteger(body.version)) {
    return apiError(event, 422, 'INVALID_DOCUMENT_VERSION', 'Document updates must include an integer version.')
  }

  const documentVersion = Number(body.version)

  if (
    body.title === undefined &&
    body.content === undefined &&
    body.parentId === undefined
  ) {
    return apiError(event, 422, 'EMPTY_DOCUMENT_UPDATE', 'At least one document field must be updated.')
  }

  const nextTitle = body.title === undefined ? existingDocument.title : body.title.trim()
  const nextContent = body.content === undefined ? existingDocument.content : body.content
  const nextParentId = body.parentId === undefined ? existingDocument.parentId : body.parentId

  if (nextTitle.length < 1 || nextTitle.length > 200) {
    return apiError(event, 422, 'INVALID_DOCUMENT_TITLE', 'Document title must be between 1 and 200 characters.')
  }

  if (nextParentId === docId) {
    return apiError(event, 422, 'DOCUMENT_PARENT_SELF', 'A document cannot be its own parent.')
  }

  const parentResult = await ensureParentFolder(db, spaceId, nextParentId)

  if (parentResult && !parentResult.ok) {
    return apiError(event, 422, parentResult.code, parentResult.message)
  }

  if (await createsDocumentCycle(db, spaceId, docId, nextParentId)) {
    return apiError(event, 422, 'DOCUMENT_CYCLE', 'This move would create a document tree cycle.')
  }

  const updatedRows = await db
    .update(documents)
    .set({
      title: nextTitle,
      content: nextContent,
      parentId: nextParentId,
      updatedBy: user?.id,
      updatedAt: sql`(unixepoch())`,
      version: sql`${documents.version} + 1`
    })
    .where(
      and(
        eq(documents.spaceId, spaceId),
        eq(documents.id, docId),
        eq(documents.version, documentVersion)
      )
    )
    .returning({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      parentId: documents.parentId,
      isFolder: documents.isFolder,
      version: documents.version,
      updatedAt: documents.updatedAt
    })

  const updatedDocument = updatedRows[0]

  if (!updatedDocument) {
    const currentDocument = await getSpaceDocument(db, spaceId, docId)

    return apiError(event, 409, 'DOCUMENT_VERSION_CONFLICT', 'Document update conflict detected.', {
      current: currentDocument
        ? {
            version: currentDocument.version,
            updatedAt: currentDocument.updatedAt
          }
        : null
    })
  }

  queueAuditLog(event, {
    action: 'UPDATE_DOC',
    spaceId,
    userId: user?.id,
    targetType: 'document',
    targetId: updatedDocument.id,
    meta: {
      title: updatedDocument.title,
      parentId: updatedDocument.parentId,
      version: updatedDocument.version
    }
  })

  return ok({
    document: updatedDocument
  })
})
