import { and, eq } from 'drizzle-orm'

import { documentShares, spaces, users } from '../../../db/schema'
import { getSpaceDocument } from './documents'
import { SpaceAccessError, isPersonalWorkspace } from './spaces'

type DatabaseLike = ReturnType<typeof import('./db').getDb>

type AuthenticatedUserLike = {
  id: number
  username: string
  createdAt: number
}

export async function assertPersonalWorkspaceOwner(
  db: DatabaseLike,
  spaceId: number,
  user: AuthenticatedUserLike | null
) {
  if (!user) {
    throw new SpaceAccessError(
      401,
      'UNAUTHORIZED',
      'Authentication is required for this action.'
    )
  }

  const [space] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdBy: spaces.createdBy,
      createdAt: spaces.createdAt
    })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1)

  if (!space) {
    throw new SpaceAccessError(404, 'SPACE_NOT_FOUND', 'Space was not found.')
  }

  if (!isPersonalWorkspace(space, user) || space.createdBy !== user.id) {
    throw new SpaceAccessError(
      403,
      'DOCUMENT_SHARING_NOT_ALLOWED',
      'Only documents in your personal workspace can be shared directly.'
    )
  }

  return space
}

export async function assertSharableDocument(
  db: DatabaseLike,
  spaceId: number,
  documentId: number
) {
  const document = await getSpaceDocument(db, spaceId, documentId)

  if (!document) {
    throw new SpaceAccessError(
      404,
      'DOCUMENT_NOT_FOUND',
      'Document was not found.'
    )
  }

  if (document.isFolder) {
    throw new SpaceAccessError(
      422,
      'DOCUMENT_SHARE_FOLDER_UNSUPPORTED',
      'Folders cannot be shared directly.'
    )
  }

  return document
}

export async function getDocumentShareRecipients(
  db: DatabaseLike,
  documentId: number
) {
  return await db
    .select({
      documentId: documentShares.documentId,
      createdAt: documentShares.createdAt,
      sharedWith: {
        id: users.id,
        username: users.username,
        avatarId: users.avatarId,
        createdAt: users.createdAt
      }
    })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.sharedWithUserId))
    .where(eq(documentShares.documentId, documentId))
}

export async function deleteDocumentShare(
  db: DatabaseLike,
  documentId: number,
  sharedWithUserId: number
) {
  await db
    .delete(documentShares)
    .where(
      and(
        eq(documentShares.documentId, documentId),
        eq(documentShares.sharedWithUserId, sharedWithUserId)
      )
    )
}

export function isDocumentSharesTableMissing(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  return message.includes('no such table: document_shares')
}

export function getDocumentSharesMigrationMessage() {
  return 'Document sharing is not available yet in this environment. Run the latest D1 migration first.'
}
