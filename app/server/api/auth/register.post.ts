import { ensureDefaultAdmin } from '../../utils/bootstrap'
import { apiError } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin(event)
  return apiError(
    event,
    403,
    'REGISTRATION_DISABLED',
    'Self registration is disabled. Ask an administrator to create your account.'
  )
})
