import { eq } from 'drizzle-orm'
import { readBody, setResponseStatus } from 'h3'

import { documentShares, users } from '../../../../../../../db/schema'
import { queueAuditLog } from '../../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import { getDb } from '../../../../../utils/db'
import { getNumericRouteParam } from '../../../../../utils/request'
import { apiError, ok } from '../../../../../utils/response'
import {
  assertPersonalWorkspaceOwner,
  assertSharableDocument,
  getDocumentShareRecipients,
  getDocumentSharesMigrationMessage,
  isDocumentSharesTableMissing
} from '../../../../../utils/shares'
import { SpaceAccessError } from '../../../../../utils/spaces'

type ShareDocumentBody = {
  username?: string
}

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

  const body = await readBody<ShareDocumentBody>(event)
  const username = body.username?.trim().toLowerCase() ?? ''

  if (!username) {
    return apiError(
      event,
      422,
      'INVALID_SHARE_USERNAME',
      'Username is required.'
    )
  }

  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  try {
    await assertPersonalWorkspaceOwner(db, spaceId, user)
    const document = await assertSharableDocument(db, spaceId, docId)

    const [sharedUser] = await db
      .select({
        id: users.id,
        username: users.username,
        avatarId: users.avatarId,
        createdAt: users.createdAt,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    if (!sharedUser || !sharedUser.isActive) {
      return apiError(
        event,
        404,
        'SHARE_USER_NOT_FOUND',
        'The target user was not found.'
      )
    }

    if (sharedUser.id === user?.id) {
      return apiError(
        event,
        422,
        'DOCUMENT_SHARE_SELF_UNSUPPORTED',
        'You already have access to your own personal document.'
      )
    }

    await db
      .insert(documentShares)
      .values({
        documentId: docId,
        ownerUserId: user.id,
        sharedWithUserId: sharedUser.id
      })
      .onConflictDoNothing({
        target: [documentShares.documentId, documentShares.sharedWithUserId]
      })

    queueAuditLog(event, {
      action: 'SHARE_DOC',
      spaceId,
      userId: user.id,
      targetType: 'document',
      targetId: docId,
      meta: {
        documentTitle: document.title,
        sharedWithUserId: sharedUser.id,
        sharedWithUsername: sharedUser.username
      }
    })

    setResponseStatus(event, 201)

    return ok({
      shares: await getDocumentShareRecipients(db, docId)
    })
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

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
      'DOCUMENT_SHARE_CREATE_FAILED',
      'Unable to share this document.'
    )
  }
})
