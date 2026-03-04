import { desc, eq } from 'drizzle-orm'

import { spaceMembers, spaces } from '../../../../db/schema'
import { getAuthenticatedUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { ok } from '../../utils/response'
import { ensurePersonalWorkspace, isPersonalWorkspace } from '../../utils/spaces'

export default defineEventHandler(async (event) => {
  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  const publicSpaces = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdAt: spaces.createdAt
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

  const joinedSpaces = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdBy: spaces.createdBy,
      createdAt: spaces.createdAt,
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
      createdAt: number
      isPersonal: boolean
      myRole: 'admin' | 'editor' | 'viewer' | null
    }
  >()

  for (const space of publicSpaces) {
    dedupedSpaces.set(space.id, {
      ...space,
      isPersonal: false,
      myRole: null
    })
  }

  for (const space of joinedSpaces) {
    dedupedSpaces.set(space.id, {
      ...space,
      isPersonal: isPersonalWorkspace(space, user)
    })
  }

  return ok({
    spaces: [...dedupedSpaces.values()].sort((left, right) => right.createdAt - left.createdAt)
  })
})
