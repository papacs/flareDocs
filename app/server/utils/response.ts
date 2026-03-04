import { setResponseStatus, type H3Event } from 'h3'

export type ApiErrorPayload = {
  code: string
  message: string
  details?: unknown
}

export function ok<T>(data: T) {
  return {
    ok: true as const,
    data
  }
}

export function apiError(
  event: H3Event,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  setResponseStatus(event, statusCode)

  return {
    ok: false as const,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details })
    } satisfies ApiErrorPayload
  }
}
