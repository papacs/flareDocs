import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

import { users } from '../../../db/schema'
import { getDb } from './db'
import { hashPassword } from './password'

export async function ensureDefaultAdmin(event: H3Event) {
  const db = getDb(event)
  const [existingAdmin] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1)

  if (existingAdmin) {
    return existingAdmin
  }

  const passwordHash = await hashPassword('admin')
  await db
    .insert(users)
    .values({
      username: 'admin',
      passwordHash
    })
    .onConflictDoNothing({
      target: users.username
    })

  const [createdAdmin] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1)

  return createdAdmin ?? null
}
