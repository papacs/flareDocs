import { desc, eq, inArray } from 'drizzle-orm'

import { documentShares, documents, spaces, users } from '../../../../db/schema'
import { getAuthenticatedUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { apiError, ok } from '../../utils/response'
import {
  getDocumentSharesMigrationMessage,
  isDocumentSharesTableMissing
} from '../../utils/shares'

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)

  if (!user) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  const db = getDb(event)

  try {
    const shareRows = await db
      .select({
        documentId: documents.id,
        title: documents.title,
        isFolder: documents.isFolder,
        updatedAt: documents.updatedAt,
        shareCreatedAt: documentShares.createdAt,
        ownerUserId: documentShares.ownerUserId,
        spaceId: spaces.id,
        spaceName: spaces.name
      })
      .from(documentShares)
      .innerJoin(documents, eq(documents.id, documentShares.documentId))
      .innerJoin(spaces, eq(spaces.id, documents.spaceId))
      .where(eq(documentShares.sharedWithUserId, user.id))
      .orderBy(desc(documents.updatedAt), desc(documentShares.createdAt))

    const ownerIds = Array.from(
      new Set(shareRows.map((share) => share.ownerUserId))
    )
    const ownerRows =
      ownerIds.length > 0
        ? await db
            .select({
              id: users.id,
              username: users.username,
              avatarId: users.avatarId,
              createdAt: users.createdAt
            })
            .from(users)
            .where(inArray(users.id, ownerIds))
        : []
    const ownersById = new Map(ownerRows.map((owner) => [owner.id, owner]))

    const shares = shareRows.flatMap((share) => {
      const owner = ownersById.get(share.ownerUserId)

      if (!owner) {
        return []
      }

      return [
        {
          documentId: share.documentId,
          title: share.title,
          isFolder: share.isFolder,
          updatedAt: share.updatedAt,
          shareCreatedAt: share.shareCreatedAt,
          owner,
          spaceId: share.spaceId,
          spaceName: share.spaceName
        }
      ]
    })

    return ok({
      shares
    })
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
      'SHARED_DOCUMENT_LIST_FAILED',
      'Unable to load shared documents.'
    )
  }
})
