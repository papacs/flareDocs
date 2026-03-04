import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { getQuery } from 'h3'

import { auditLogs, users } from '../../../../../db/schema'
import { getAuthenticatedUser } from '../../../utils/auth'
import { getDb } from '../../../utils/db'
import { getNumericRouteParam } from '../../../utils/request'
import { apiError, ok } from '../../../utils/response'
import { assertSpaceRole, SpaceAccessError } from '../../../utils/spaces'

type AuditLogQuery = {
  action?: string
  dateFrom?: string
  dateTo?: string
  page?: string
  pageSize?: string
  userId?: string
}

function parseOptionalInteger(value?: string) {
  if (!value) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function parseOptionalDate(value?: string, endOfDay = false) {
  if (!value) {
    return null
  }

  const normalizedValue = endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`
  const parsedValue = Date.parse(normalizedValue)

  if (Number.isNaN(parsedValue)) {
    return null
  }

  return Math.floor(parsedValue / 1000)
}

export default defineEventHandler(async (event) => {
  const spaceId = getNumericRouteParam(event, 'spaceId')

  if (!spaceId) {
    return apiError(event, 422, 'INVALID_SPACE_ID', 'Space id must be a positive integer.')
  }

  const user = await getAuthenticatedUser(event)
  const db = getDb(event)

  try {
    await assertSpaceRole(db, spaceId, user, 'admin')
  } catch (error) {
    if (error instanceof SpaceAccessError) {
      return apiError(event, error.statusCode, error.code, error.message)
    }

    return apiError(event, 500, 'SPACE_PERMISSION_FAILED', 'Unable to verify admin access.')
  }

  const query = getQuery(event) as AuditLogQuery
  const page = parseOptionalInteger(query.page) ?? 1
  const pageSize = Math.min(parseOptionalInteger(query.pageSize) ?? 20, 100)
  const userId = parseOptionalInteger(query.userId)
  const dateFrom = parseOptionalDate(query.dateFrom)
  const dateTo = parseOptionalDate(query.dateTo, true)

  const filters = [
    eq(auditLogs.spaceId, spaceId),
    query.action ? eq(auditLogs.action, query.action) : undefined,
    userId ? eq(auditLogs.userId, userId) : undefined,
    dateFrom ? gte(auditLogs.createdAt, dateFrom) : undefined,
    dateTo ? lte(auditLogs.createdAt, dateTo) : undefined
  ].filter(Boolean)

  const whereClause = filters.length > 0 ? and(...filters) : undefined

  const [totalResult] = await db
    .select({
      count: count()
    })
    .from(auditLogs)
    .where(whereClause)

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      meta: auditLogs.meta,
      ip: auditLogs.ip,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      username: users.username
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return ok({
    logs: rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      meta: row.meta ? JSON.parse(row.meta) : null,
      ip: row.ip,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
      user: row.userId
        ? {
            id: row.userId,
            username: row.username ?? 'unknown'
          }
        : null
    })),
    pagination: {
      page,
      pageSize,
      total: totalResult?.count ?? 0
    }
  })
})
