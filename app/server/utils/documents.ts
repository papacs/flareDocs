import { and, eq } from 'drizzle-orm'

import { documents } from '../../../db/schema'

type DatabaseLike = ReturnType<typeof import('./db').getDb>

export async function getSpaceDocument(db: DatabaseLike, spaceId: number, documentId: number) {
  const [document] = await db
    .select({
      id: documents.id,
      spaceId: documents.spaceId,
      title: documents.title,
      content: documents.content,
      parentId: documents.parentId,
      isFolder: documents.isFolder,
      version: documents.version,
      createdBy: documents.createdBy,
      updatedBy: documents.updatedBy,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .where(and(eq(documents.spaceId, spaceId), eq(documents.id, documentId)))
    .limit(1)

  return document ?? null
}

export async function ensureParentFolder(
  db: DatabaseLike,
  spaceId: number,
  parentId?: number | null
) {
  if (!parentId) {
    return null
  }

  const parentDocument = await getSpaceDocument(db, spaceId, parentId)

  if (!parentDocument) {
    return {
      ok: false as const,
      code: 'PARENT_NOT_FOUND',
      message: 'Parent document was not found in this space.'
    }
  }

  if (!parentDocument.isFolder) {
    return {
      ok: false as const,
      code: 'PARENT_NOT_FOLDER',
      message: 'Parent document must be a folder.'
    }
  }

  return {
    ok: true as const,
    parent: parentDocument
  }
}

export async function createsDocumentCycle(
  db: DatabaseLike,
  spaceId: number,
  documentId: number,
  nextParentId?: number | null
) {
  let cursor = nextParentId ?? null

  while (cursor) {
    if (cursor === documentId) {
      return true
    }

    const currentParent = await getSpaceDocument(db, spaceId, cursor)

    if (!currentParent) {
      return false
    }

    cursor = currentParent.parentId
  }

  return false
}
