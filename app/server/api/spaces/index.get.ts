import { desc, eq, inArray, or, sql } from 'drizzle-orm'

import { documents, spaceMembers, spaces } from '../../../../db/schema'
import { getAuthenticatedUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { ok } from '../../utils/response'
import {
  ensurePersonalWorkspace,
  isPersonalWorkspace
} from '../../utils/spaces'

export default defineEventHandler(async (event) => {
  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  const publicSpaces = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdBy: spaces.createdBy,
      createdAt: spaces.createdAt,
      documentCount: sql<number>`0`
    })
    .from(spaces)
    .where(eq(spaces.visibility, 'public'))
    .orderBy(desc(spaces.createdAt))

  if (!user) {
    return ok({
      spaces: publicSpaces.map((space) => ({
        ...space,
        isPersonal: false,
        myRole: null
      }))
    })
  }

  await ensurePersonalWorkspace(db, user)

  const teamSpaces = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdBy: spaces.createdBy,
      createdAt: spaces.createdAt,
      documentCount: sql<number>`0`
    })
    .from(spaces)
    .where(or(eq(spaces.visibility, 'team'), eq(spaces.visibility, 'public')))
    .orderBy(desc(spaces.createdAt))

  const joinedSpaces = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdBy: spaces.createdBy,
      createdAt: spaces.createdAt,
      documentCount: sql<number>`0`,
      myRole: spaceMembers.roleInSpace
    })
    .from(spaceMembers)
    .innerJoin(spaces, eq(spaces.id, spaceMembers.spaceId))
    .where(eq(spaceMembers.userId, user.id))
    .orderBy(desc(spaces.createdAt))

  const dedupedSpaces = new Map<
    number,
    {
      id: number
      name: string
      slug: string
      visibility: 'private' | 'team' | 'public'
      createdBy: number | null
      createdAt: number
      documentCount: number
      isPersonal: boolean
      myRole: 'admin' | 'editor' | 'viewer' | null
    }
  >()

  for (const space of teamSpaces) {
    dedupedSpaces.set(space.id, {
      ...space,
      isPersonal: false,
      myRole: space.visibility === 'team' ? 'editor' : null
    })
  }

  for (const space of joinedSpaces) {
    dedupedSpaces.set(space.id, {
      ...space,
      isPersonal: isPersonalWorkspace(space, user)
    })
  }

  const spaceList = [...dedupedSpaces.values()]
  const spaceIds = spaceList.map((space) => space.id)
  const documentCountBySpaceId = new Map<number, number>()

  if (spaceIds.length) {
    const documentCounts = await db
      .select({
        spaceId: documents.spaceId,
        count: sql<number>`cast(count(*) as int)`
      })
      .from(documents)
      .where(inArray(documents.spaceId, spaceIds))
      .groupBy(documents.spaceId)

    for (const row of documentCounts) {
      documentCountBySpaceId.set(row.spaceId, row.count)
    }
  }

  return ok({
    spaces: spaceList
      .map((space) => ({
        ...space,
        documentCount: documentCountBySpaceId.get(space.id) ?? 0
      }))
      .sort((left, right) => right.createdAt - left.createdAt)
  })
})
