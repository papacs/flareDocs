import { createError, getRequestURL, type H3Event } from 'h3'
import type { R2Bucket } from '@cloudflare/workers-types'

import { getCloudflareEnv } from './db'

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024

export const ALLOWED_UPLOAD_CONTENT_TYPES = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const

export type AllowedUploadContentType = keyof typeof ALLOWED_UPLOAD_CONTENT_TYPES

type CloudflareStorageBindings = ReturnType<typeof getCloudflareEnv> & {
  R2_ASSETS?: R2Bucket
}

export function getAssetBucket(event: H3Event) {
  const env = getCloudflareEnv(event) as CloudflareStorageBindings

  if (!env.R2_ASSETS) {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 binding `R2_ASSETS` is not configured for this runtime.'
    })
  }

  return env.R2_ASSETS
}

export function isAllowedUploadContentType(
  contentType: string
): contentType is AllowedUploadContentType {
  return contentType in ALLOWED_UPLOAD_CONTENT_TYPES
}

export function getUploadExtension(contentType: AllowedUploadContentType) {
  return ALLOWED_UPLOAD_CONTENT_TYPES[contentType]
}

export function buildAssetUrl(event: H3Event, key: string) {
  const requestUrl = getRequestURL(event)
  return `${requestUrl.origin}/uploads/${key}`
}

const ASSET_KEY_PATTERN = /^\d+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(avif|gif|jpg|png|webp)$/

export function isValidAssetKey(key: string) {
  return ASSET_KEY_PATTERN.test(key)
}
