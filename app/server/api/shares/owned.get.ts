import { desc, eq } from 'drizzle-orm'

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
        spaceId: spaces.id,
        spaceName: spaces.name,
        sharedWith: {
          id: users.id,
          username: users.username,
          avatarId: users.avatarId,
          createdAt: users.createdAt
        }
      })
      .from(documentShares)
      .innerJoin(documents, eq(documents.id, documentShares.documentId))
      .innerJoin(spaces, eq(spaces.id, documents.spaceId))
      .innerJoin(users, eq(users.id, documentShares.sharedWithUserId))
      .where(eq(documentShares.ownerUserId, user.id))
      .orderBy(desc(documentShares.createdAt), desc(documents.updatedAt))

    const groupedShares = new Map<
      number,
      {
        documentId: number
        spaceId: number
        spaceName: string
        title: string
        isFolder: boolean
        updatedAt: number
        lastSharedAt: number
        recipients: typeof shareRows[number]['sharedWith'][]
      }
    >()

    for (const share of shareRows) {
      const existing = groupedShares.get(share.documentId)

      if (!existing) {
        groupedShares.set(share.documentId, {
          documentId: share.documentId,
          spaceId: share.spaceId,
          spaceName: share.spaceName,
          title: share.title,
          isFolder: share.isFolder,
          updatedAt: share.updatedAt,
          lastSharedAt: share.shareCreatedAt,
          recipients: [share.sharedWith]
        })
        continue
      }

      existing.lastSharedAt = Math.max(existing.lastSharedAt, share.shareCreatedAt)
      existing.updatedAt = Math.max(existing.updatedAt, share.updatedAt)
      existing.recipients.push(share.sharedWith)
    }

    const shares = [...groupedShares.values()]
      .map((share) => ({
        ...share,
        shareCount: share.recipients.length
      }))
      .sort((left, right) => {
        if (left.lastSharedAt !== right.lastSharedAt) {
          return right.lastSharedAt - left.lastSharedAt
        }

        return right.updatedAt - left.updatedAt
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
      'OWNED_SHARED_DOCUMENT_LIST_FAILED',
      'Unable to load documents you shared.'
    )
  }
})
