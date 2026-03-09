import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

import { users } from '../../../db/schema'
import { getDb } from './db'
import { hashPassword } from './password'
import { ensurePersonalWorkspace } from './spaces'

let bootstrapAdminResult:
  | Awaited<ReturnType<typeof ensureDefaultAdminInternal>>
  | undefined
let bootstrapAdminPromise: Promise<
  Awaited<ReturnType<typeof ensureDefaultAdminInternal>>
> | null = null

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

  if (bootstrapAdminResult !== undefined) {
    return bootstrapAdminResult
  }

  if (bootstrapAdminPromise) {
    return await bootstrapAdminPromise
  }

  bootstrapAdminPromise = ensureDefaultAdminInternal(event, bootstrapPassword)

  try {
    const admin = await bootstrapAdminPromise
    bootstrapAdminResult = admin
    return admin
  } finally {
    bootstrapAdminPromise = null
  }
}

async function ensureDefaultAdminInternal(
  event: H3Event,
  bootstrapPassword: string
) {
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
    await ensurePersonalWorkspace(db, existingAdmin)
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
