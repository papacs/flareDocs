import { and, eq, inArray, or } from 'drizzle-orm'

import { documentShares, documents, spaces, users } from '../../../../db/schema'
import { getAuthenticatedUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { getNumericRouteParam } from '../../utils/request'
import { apiError, ok } from '../../utils/response'
import {
  getDocumentSharesMigrationMessage,
  isDocumentSharesTableMissing
} from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const documentId = getNumericRouteParam(event, 'documentId')

  if (!documentId) {
    return apiError(
      event,
      422,
      'INVALID_DOCUMENT_ID',
      'Document id must be a positive integer.'
    )
  }

  const user = await getAuthenticatedUser(event)

  if (!user) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  const db = getDb(event)
  let accessRecord:
    | {
        ownerUserId: number
        sharedWithUserId: number
      }
    | undefined

  try {
    ;[accessRecord] = await db
      .select({
        ownerUserId: documentShares.ownerUserId,
        sharedWithUserId: documentShares.sharedWithUserId
      })
      .from(documentShares)
      .where(
        and(
          eq(documentShares.documentId, documentId),
          or(
            eq(documentShares.ownerUserId, user.id),
            eq(documentShares.sharedWithUserId, user.id)
          )
        )
      )
      .limit(1)
  } catch (error) {
    if (isDocumentSharesTableMissing(error)) {
      return apiError(
        event,
        503,
        'DOCUMENT_SHARES_MIGRATION_REQUIRED',
        getDocumentSharesMigrationMessage()
      )
    }

    return apiError(
      event,
      500,
      'SHARED_DOCUMENT_ACCESS_LOOKUP_FAILED',
      'Unable to verify access to this shared document.'
    )
  }

  if (!accessRecord) {
    return apiError(
      event,
      403,
      'SHARED_DOCUMENT_ACCESS_DENIED',
      'You do not have access to this shared document.'
    )
  }

  const [sharedDocument] = await db
    .select({
      document: {
        id: documents.id,
        title: documents.title,
        content: documents.content,
        parentId: documents.parentId,
        isFolder: documents.isFolder,
        version: documents.version,
        createdAt: documents.createdAt,
        createdBy: documents.createdBy,
        updatedAt: documents.updatedAt,
        updatedBy: documents.updatedBy
      },
      ownerUserId: documentShares.ownerUserId,
      space: {
        id: spaces.id,
        name: spaces.name
      }
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(spaces, eq(spaces.id, documents.spaceId))
    .where(eq(documentShares.documentId, documentId))
    .limit(1)

  if (!sharedDocument) {
    return apiError(
      event,
      404,
      'SHARED_DOCUMENT_NOT_FOUND',
      'Shared document was not found.'
    )
  }

  const userIds = Array.from(
    new Set(
      [
        sharedDocument.ownerUserId,
        sharedDocument.document.createdBy,
        sharedDocument.document.updatedBy
      ].filter(
        (value): value is number => typeof value === 'number' && value > 0
      )
    )
  )
  const relatedUsers =
    userIds.length > 0
      ? await db
          .select({
            id: users.id,
            username: users.username,
            avatarId: users.avatarId,
            createdAt: users.createdAt
          })
          .from(users)
          .where(inArray(users.id, userIds))
      : []
  const usersById = new Map(
    relatedUsers.map((relatedUser) => [relatedUser.id, relatedUser])
  )
  const owner = usersById.get(sharedDocument.ownerUserId)

  if (!owner) {
    return apiError(
      event,
      404,
      'SHARED_DOCUMENT_OWNER_NOT_FOUND',
      'Shared document owner was not found.'
    )
  }

  const path: Array<{ id: number; title: string }> = []
  let cursor = sharedDocument.document.parentId

  while (cursor) {
    const [parentDocument] = await db
      .select({
        id: documents.id,
        title: documents.title,
        parentId: documents.parentId
      })
      .from(documents)
      .where(eq(documents.id, cursor))
      .limit(1)

    if (!parentDocument) {
      break
    }

    path.unshift({
      id: parentDocument.id,
      title: parentDocument.title
    })
    cursor = parentDocument.parentId
  }

  return ok({
    document: {
      ...sharedDocument.document,
      createdByName: sharedDocument.document.createdBy
        ? (usersById.get(sharedDocument.document.createdBy)?.username ?? null)
        : null,
      updatedByName: sharedDocument.document.updatedBy
        ? (usersById.get(sharedDocument.document.updatedBy)?.username ?? null)
        : null
    },
    owner,
    space: sharedDocument.space,
    path
  })
})
