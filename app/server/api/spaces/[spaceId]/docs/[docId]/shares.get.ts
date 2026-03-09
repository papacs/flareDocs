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
    await assertPersonalWorkspaceOwner(db, spaceId, user)
    await assertSharableDocument(db, spaceId, docId)
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
      'DOCUMENT_SHARE_LOOKUP_FAILED',
      'Unable to load document shares.'
    )
  }

  return ok({
    shares: await getDocumentShareRecipients(db, docId)
  })
})
