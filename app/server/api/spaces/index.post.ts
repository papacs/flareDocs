import { setResponseStatus } from 'h3'

import { spaceMembers, spaces } from '../../../../db/schema'
import { queueAuditLog } from '../../utils/audit'
import { getAuthenticatedUser } from '../../utils/auth'
import { getDb } from '../../utils/db'
import { createUniqueSpaceSlug } from '../../utils/spaces'
import { apiError, ok } from '../../utils/response'

type CreateSpaceBody = {
  name?: string
  visibility?: 'private' | 'team' | 'public'
}

function isValidVisibility(value: string): value is 'private' | 'team' | 'public' {
  return value === 'private' || value === 'team' || value === 'public'
}

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)

  if (!user) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  const body = await readBody<CreateSpaceBody>(event)
  const name = body.name?.trim() ?? ''
  const visibility = body.visibility ?? 'team'

  if (name.length < 2 || name.length > 64) {
    return apiError(event, 422, 'INVALID_SPACE_NAME', 'Space name must be between 2 and 64 characters.')
  }

  if (!isValidVisibility(visibility)) {
    return apiError(event, 422, 'INVALID_VISIBILITY', 'Visibility must be private, team, or public.')
  }

  const db = getDb(event)
  const slug = await createUniqueSpaceSlug(db, name)
  const [createdSpace] = await db
    .insert(spaces)
    .values({
      name,
      slug,
      visibility,
      createdBy: user.id
    })
    .returning({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      visibility: spaces.visibility,
      createdBy: spaces.createdBy,
      createdAt: spaces.createdAt
    })

  if (!createdSpace) {
    return apiError(event, 500, 'SPACE_CREATE_FAILED', 'Unable to create space.')
  }

  await db.insert(spaceMembers).values({
    spaceId: createdSpace.id,
    userId: user.id,
    roleInSpace: 'admin'
  })
  queueAuditLog(event, {
    action: 'CREATE_SPACE',
    spaceId: createdSpace.id,
    userId: user.id,
    targetType: 'space',
    targetId: createdSpace.id,
    meta: {
      name: createdSpace.name,
      visibility: createdSpace.visibility
    }
  })

  setResponseStatus(event, 201)

  return ok({
    space: {
      ...createdSpace,
      isPersonal: false,
      myRole: 'admin' as const
    }
  })
})
