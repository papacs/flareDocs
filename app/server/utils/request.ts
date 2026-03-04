import type { H3Event } from 'h3'

export function getNumericRouteParam(event: H3Event, key: string) {
  const rawValue = event.context.params?.[key]
  const parsedValue = Number(rawValue)

  if (!rawValue || !Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null
  }

  return parsedValue
}
