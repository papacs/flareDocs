import { desc } from 'drizzle-orm'

import { users } from '../../../../../db/schema'
import { ensureDefaultAdmin } from '../../../utils/bootstrap'
import { getAuthenticatedUser, isSystemAdminUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { apiError, ok } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin(event)

  const currentUser = await getAuthenticatedUser(event)

  if (!currentUser) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  if (!isSystemAdminUser(currentUser)) {
    return apiError(event, 403, 'SYSTEM_ADMIN_REQUIRED', 'Only system administrators can manage users.')
  }

  const db = getDb(event)
  const userRows = await db
    .select({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return ok({
    users: userRows
  })
})
