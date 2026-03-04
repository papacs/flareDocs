import { queueAuditLog } from '../../utils/audit'
import { clearAuthCookie, getAuthenticatedUser } from '../../utils/auth'
import { ok } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)

  clearAuthCookie(event)

  if (user) {
    queueAuditLog(event, {
      action: 'LOGOUT',
      userId: user.id,
      targetType: 'user',
      targetId: user.id
    })
  }

  return ok({
    loggedOut: true
  })
})
