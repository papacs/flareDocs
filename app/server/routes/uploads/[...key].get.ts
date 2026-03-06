import { createError, getRouterParam, setHeader } from 'h3'

import { getAssetBucket, isValidAssetKey } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const rawKey = getRouterParam(event, 'key')

  if (!rawKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Asset key is required.'
    })
  }

  const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey

  if (!isValidAssetKey(key)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Asset was not found.'
    })
  }

  const object = await getAssetBucket(event).get(key)

  if (!object || !object.body) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Asset was not found.'
    })
  }

  setHeader(
    event,
    'content-type',
    object.httpMetadata?.contentType ?? 'application/octet-stream'
  )
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  return object.body
})
