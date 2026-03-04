import { readMultipartFormData } from 'h3'

import { getAuthenticatedUser } from '../../../utils/auth'
import { queueAuditLog } from '../../../utils/audit'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../utils/spaces'
import {
  buildAssetUrl,
  getAssetBucket,
  getUploadExtension,
  isAllowedUploadContentType,
  MAX_UPLOAD_SIZE
} from '../../../utils/storage'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const db = getDb(event)
  const user = await getAuthenticatedUser(event)
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 400, 'INVALID_SPACE_ID', 'A valid space id is required.')
  }

  try {
    await assertSpaceRole(db, spaceId, user, 'editor')
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    throw error
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file' && part.filename && part.data)

  if (!file?.filename || !file.type || !file.data) {
    return apiError(event, 400, 'UPLOAD_FILE_MISSING', 'Multipart upload requires a `file` field.')
  }

  if (!isAllowedUploadContentType(file.type)) {
    return apiError(
      event,
      415,
      'UPLOAD_TYPE_NOT_ALLOWED',
      'Only PNG, JPEG, GIF, WEBP, and AVIF images are allowed.'
    )
  }

  if (file.data.byteLength > MAX_UPLOAD_SIZE) {
    return apiError(
      event,
      413,
      'UPLOAD_TOO_LARGE',
      `Upload exceeds the ${Math.floor(MAX_UPLOAD_SIZE / (1024 * 1024))} MB limit.`
    )
  }

  const extension = getUploadExtension(file.type)
  const key = `${spaceId}/${crypto.randomUUID()}.${extension}`
  const bucket = getAssetBucket(event)

  await bucket.put(key, file.data, {
    httpMetadata: {
      contentType: file.type
    },
    customMetadata: {
      uploadedBy: user?.username ?? 'unknown'
    }
  })
  queueAuditLog(event, {
    action: 'UPLOAD_ASSET',
    spaceId,
    userId: user?.id,
    targetType: 'asset',
    meta: {
      key,
      size: file.data.byteLength,
      contentType: file.type
    }
  })

  return ok({
    url: buildAssetUrl(event, key),
    key,
    size: file.data.byteLength,
    contentType: file.type
  })
})
