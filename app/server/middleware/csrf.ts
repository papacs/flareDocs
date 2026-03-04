import { getHeader, getRequestURL } from 'h3'

import { apiError } from '../utils/response'

function isWriteMethod(method?: string) {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'
}

function isApiRoute(pathname: string) {
  return pathname.startsWith('/api/')
}

function isMultipartRequest(contentType?: string | null) {
  return contentType?.toLowerCase().startsWith('multipart/form-data') ?? false
}

function isJsonRequest(contentType?: string | null) {
  return contentType?.toLowerCase().startsWith('application/json') ?? false
}

function isSameOrigin(requestUrl: URL, headerValue?: string | null) {
  if (!headerValue) {
    return false
  }

  try {
    return new URL(headerValue).origin === requestUrl.origin
  } catch {
    return false
  }
}

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)

  if (!isApiRoute(requestUrl.pathname)) {
    return
  }

  if (!isWriteMethod(event.method)) {
    return
  }

  const origin = getHeader(event, 'origin')
  const referer = getHeader(event, 'referer')

  if (!isSameOrigin(requestUrl, origin) && !(!origin && isSameOrigin(requestUrl, referer))) {
    return apiError(event, 403, 'CSRF_ORIGIN_MISMATCH', 'Cross-site write requests are not allowed.')
  }

  const contentType = getHeader(event, 'content-type')

  if (!isJsonRequest(contentType) && !isMultipartRequest(contentType)) {
    return apiError(
      event,
      415,
      'UNSUPPORTED_CONTENT_TYPE',
      'Write APIs only accept application/json, except multipart uploads.'
    )
  }
})
