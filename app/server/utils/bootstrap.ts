import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

import { users } from '../../../db/schema'
import { getDb } from './db'
import { hashPassword } from './password'
import { ensurePersonalWorkspace } from './spaces'

export async function ensureDefaultAdmin(event: H3Event) {
  const rawBootstrapPassword = useRuntimeConfig(event).bootstrapAdminPassword
  const bootstrapPassword =
    typeof rawBootstrapPassword === 'string'
      ? rawBootstrapPassword.trim()
      : rawBootstrapPassword === null || rawBootstrapPassword === undefined
        ? ''
        : String(rawBootstrapPassword).trim()

  if (!bootstrapPassword) {
    return null
  }

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
    return existingAdmin
  }

  const passwordHash = await hashPassword(bootstrapPassword)
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
