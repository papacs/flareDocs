import { ensureDefaultAdmin } from '../../utils/bootstrap'
import { getAuthenticatedUser } from '../../utils/auth'
import { apiError, ok } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin(event)

  const user = await getAuthenticatedUser(event)

  if (!user) {
    return apiError(event, 401, 'UNAUTHORIZED', 'Authentication is required.')
  }

  return ok({
    user
  })
})
