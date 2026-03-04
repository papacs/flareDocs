import { getAuthenticatedUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import { assertSpaceRole, isPersonalWorkspace, SpaceAccessError } from '../../../utils/spaces'

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 422, 'INVALID_SPACE_ID', 'Space id must be a positive integer.')
  }

  const db = getDb(event)
  const user = await getAuthenticatedUser(event)

  try {
    const context = await assertSpaceRole(db, spaceId, user, 'viewer')

    return ok({
      space: {
        ...context.space,
        isPersonal: isPersonalWorkspace(context.space, user),
        myRole: context.role
      }
    })
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_LOOKUP_FAILED', 'Unable to load the requested space.')
  }
})
