import { and, eq } from 'drizzle-orm'

import { spaceMembers, spaces, type SpaceRole } from '../../../db/schema'

type DatabaseLike = ReturnType<typeof import('./db').getDb>

type AuthenticatedUser = {
  id: number
  username: string
  createdAt: number
}

const roleRank: Record<SpaceRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
}

export class SpaceAccessError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'SpaceAccessError'
    this.statusCode = statusCode
    this.code = code
  }
}

export async function getSpaceContext(
  db: DatabaseLike,
  spaceId: number,
  userId?: number | null
) {
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

  if (!userId) {
    return {
      space,
      role: null
    }
  }

  const [membership] = await db
    .select({
      role: spaceMembers.roleInSpace
    })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
    .limit(1)

  return {
    space,
    role: membership?.role ?? null
  }
}

export async function assertSpaceRole(
  db: DatabaseLike,
  spaceId: number,
  user: AuthenticatedUser | null,
  requiredRole: SpaceRole
) {
  const { space, role } = await getSpaceContext(db, spaceId, user?.id)

  if (requiredRole === 'viewer' && space.visibility === 'public') {
    return {
      space,
      role
    }
  }

  if (!user) {
    throw new SpaceAccessError(401, 'UNAUTHORIZED', 'Authentication is required for this space.')
  }

  if (!role) {
    throw new SpaceAccessError(403, 'SPACE_ACCESS_DENIED', 'You do not have access to this space.')
  }

  if (roleRank[role] < roleRank[requiredRole]) {
    throw new SpaceAccessError(
      403,
      'INSUFFICIENT_SPACE_ROLE',
      `This action requires the ${requiredRole} role in the space.`
    )
  }

  return {
    space,
    role
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export async function createUniqueSpaceSlug(db: DatabaseLike, name: string) {
  const baseSlug = slugify(name) || 'space'
  let slug = baseSlug
  let suffix = 1

  for (;;) {
    const [existingSpace] = await db
      .select({ id: spaces.id })
      .from(spaces)
      .where(eq(spaces.slug, slug))
      .limit(1)

    if (!existingSpace) {
      return slug
    }

    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }
}
