import { documents } from '../../../../../../db/schema'
import { queueAuditLog } from '../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../utils/auth'
import { getDb } from '../../../../utils/db'
import { ensureParentFolder } from '../../../../utils/documents'
import { getNumericRouteParam } from '../../../../utils/request'
import { apiError, ok } from '../../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../../utils/spaces'

type CreateDocumentBody = {
  title?: string
  parentId?: number | null
  isFolder?: boolean
}

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 422, 'INVALID_SPACE_ID', 'Space id must be a positive integer.')
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

  const body = await readBody<CreateDocumentBody>(event)
  const title = body.title?.trim() ?? ''
  const parentId = body.parentId ?? null
  const isFolder = Boolean(body.isFolder)

  if (title.length < 1 || title.length > 200) {
    return apiError(event, 422, 'INVALID_DOCUMENT_TITLE', 'Document title must be between 1 and 200 characters.')
  }

  const parentResult = await ensureParentFolder(db, spaceId, parentId)

  if (parentResult && !parentResult.ok) {
    return apiError(event, 422, parentResult.code, parentResult.message)
  }

  const [createdDocument] = await db
    .insert(documents)
    .values({
      spaceId,
      title,
      parentId,
      isFolder,
      createdBy: user?.id,
      updatedBy: user?.id
    })
    .returning({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      parentId: documents.parentId,
      isFolder: documents.isFolder,
      version: documents.version,
      updatedAt: documents.updatedAt
    })

  if (!createdDocument) {
    return apiError(event, 500, 'DOCUMENT_CREATE_FAILED', 'Unable to create document.')
  }

  queueAuditLog(event, {
    action: 'CREATE_DOC',
    spaceId,
    userId: user?.id,
    targetType: 'document',
    targetId: createdDocument.id,
    meta: {
      title: createdDocument.title,
      isFolder: createdDocument.isFolder,
      parentId: createdDocument.parentId
    }
  })

  setResponseStatus(event, 201)

  return ok({
    document: createdDocument
  })
})
