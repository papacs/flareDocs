import { getHeader, type H3Event } from 'h3'

import { auditLogs } from '../../../db/schema'
import { getDb } from './db'

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_SPACE'
  | 'UPDATE_SPACE'
  | 'DELETE_SPACE'
  | 'ADD_MEMBER'
  | 'UPDATE_MEMBER_ROLE'
  | 'REMOVE_MEMBER'
  | 'CREATE_USER'
  | 'UPDATE_USER_ACCOUNT'
  | 'DELETE_USER'
  | 'UPDATE_PROFILE'
  | 'CREATE_DOC'
  | 'UPDATE_DOC'
  | 'DELETE_DOC'
  | 'UPLOAD_ASSET'

type QueueAuditLogInput = {
  action: AuditAction
  spaceId?: number | null
  userId?: number | null
  targetType?: string | null
  targetId?: number | null
  meta?: Record<string, unknown> | null
}

type CloudflareExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void
}

type CloudflareEventContext = H3Event['context'] & {
  cloudflare?: {
    context?: CloudflareExecutionContext
  }
}

function getRequestIp(event: H3Event) {
  const forwardedIp =
    getHeader(event, 'cf-connecting-ip') ?? getHeader(event, 'x-forwarded-for')
  return forwardedIp?.split(',')[0]?.trim() ?? null
}

function getWaitUntil(event: H3Event) {
  const executionContext = (event.context as CloudflareEventContext).cloudflare
    ?.context

  if (!executionContext?.waitUntil) {
    return null
  }

  return executionContext.waitUntil.bind(executionContext)
}

export async function writeAuditLog(event: H3Event, input: QueueAuditLogInput) {
  const db = getDb(event)

  await db.insert(auditLogs).values({
    spaceId: input.spaceId ?? null,
    userId: input.userId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    meta: input.meta ? JSON.stringify(input.meta) : null,
    ip: getRequestIp(event),
    userAgent: getHeader(event, 'user-agent') ?? null
  })
}

export function queueAuditLog(event: H3Event, input: QueueAuditLogInput) {
  const task = writeAuditLog(event, input).catch((error) => {
    console.error('Failed to write audit log.', error)
  })
  const waitUntil = getWaitUntil(event)

  if (waitUntil) {
    try {
      waitUntil(task)
      return
    } catch (error) {
      console.warn('Falling back to inline audit log promise execution.', error)
    }
  }

  void task
}
