import { sql } from 'drizzle-orm'

import { users } from '../../../../db/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = getDb(event)
  const [result] = await db.select({ userCount: sql<number>`count(*)` }).from(users)

  return {
    ok: true,
    data: {
      status: 'ok',
      userCount: Number(result?.userCount ?? 0)
    }
  }
})
