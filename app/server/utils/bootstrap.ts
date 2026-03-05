import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

import { users } from '../../../db/schema'
import { getDb } from './db'
import { hashPassword } from './password'
import { ensurePersonalWorkspace } from './spaces'

export async function ensureDefaultAdmin(event: H3Event) {
  const db = getDb(event)
  const [existingAdmin] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1)

  if (existingAdmin) {
    if (!existingAdmin.isSystemAdmin || !existingAdmin.isActive) {
      await db
        .update(users)
        .set({ isSystemAdmin: true, isActive: true })
        .where(eq(users.id, existingAdmin.id))

      return {
        ...existingAdmin,
        isSystemAdmin: true,
        isActive: true
      }
    }

    return existingAdmin
  }

  const passwordHash = await hashPassword('admin')
  await db
    .insert(users)
    .values({
      username: 'admin',
      passwordHash,
      avatarId: 'qq-classic-01',
      isSystemAdmin: true,
      isActive: true
    })
    .onConflictDoNothing({
      target: users.username
    })

  const [createdAdmin] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarId: users.avatarId,
      isSystemAdmin: users.isSystemAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1)

  if (createdAdmin) {
    await ensurePersonalWorkspace(db, createdAdmin)
  }

  return createdAdmin ?? null
}
