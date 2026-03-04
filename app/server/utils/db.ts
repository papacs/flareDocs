import { createError, type H3Event } from 'h3'
import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../../../db/schema'

type CloudflareBindings = {
  DB?: D1Database
}

type CloudflareEventContext = H3Event['context'] & {
  cloudflare?: {
    env?: CloudflareBindings
  }
}

export function getCloudflareEnv(event: H3Event): CloudflareBindings {
  return (event.context as CloudflareEventContext).cloudflare?.env ?? {}
}

export function getDb(event: H3Event) {
  const env = getCloudflareEnv(event)

  if (!env.DB) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 binding `DB` is not configured for this runtime.'
    })
  }

  return drizzle(env.DB, { schema })
}
