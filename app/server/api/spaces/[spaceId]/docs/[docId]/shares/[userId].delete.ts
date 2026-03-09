import { queueAuditLog } from '../../../../../../utils/audit'
import { getAuthenticatedUser } from '../../../../../../utils/auth'
import { getDb } from '../../../../../../utils/db'
import { getNumericRouteParam } from '../../../../../../utils/request'
import { apiError, ok } from '../../../../../../utils/response'
import {
  assertPersonalWorkspaceOwner,
  assertSharableDocument,
  deleteDocumentShare,
  getDocumentShareRecipients,
  getDocumentSharesMigrationMessage,
  isDocumentSharesTableMissing
} from '../../../../../../utils/shares'
import { SpaceAccessError } from '../../../../../../utils/spaces'

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')
  const docId = getNumericRouteParam(event, 'docId')
  const userId = getNumericRouteParam(event, 'userId')

  if (!spaceId || !docId || !userId) {
    return apiError(
      event,
      422,
      'INVALID_ROUTE_PARAMS',
      'Space id, document id, and user id must be positive integers.'
    )
  }

  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  try {
    const document = await assertSharableDocument(db, spaceId, docId)
    await assertPersonalWorkspaceOwner(db, spaceId, user)
    await deleteDocumentShare(db, docId, userId)

    queueAuditLog(event, {
      action: 'UNSHARE_DOC',
      spaceId,
      userId: user?.id,
      targetType: 'document',
      targetId: docId,
      meta: {
        documentTitle: document.title,
        sharedWithUserId: userId
      }
    })

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
      'DOCUMENT_SHARE_DELETE_FAILED',
      'Unable to revoke this share.'
    )
  }
})
