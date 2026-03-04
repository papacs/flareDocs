import { sql } from 'drizzle-orm'
import {
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text
} from 'drizzle-orm/sqlite-core'

export const spaceVisibilityValues = ['team', 'public'] as const
export const spaceRoleValues = ['admin', 'editor', 'viewer'] as const
export const documentTargetTypes = ['space', 'document', 'asset'] as const

export type SpaceVisibility = (typeof spaceVisibilityValues)[number]
export type SpaceRole = (typeof spaceRoleValues)[number]

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`)
})

export const spaces = sqliteTable('spaces', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  visibility: text('visibility', { enum: spaceVisibilityValues })
    .notNull()
    .default('team'),
  createdBy: integer('created_by').references(() => users.id, {
    onDelete: 'set null'
  }),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`)
})

export const spaceMembers = sqliteTable(
  'space_members',
  {
    spaceId: integer('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleInSpace: text('role_in_space', { enum: spaceRoleValues }).notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.spaceId, table.userId] })
  })
)

export const documents = sqliteTable(
  'documents',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    spaceId: integer('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    parentId: integer('parent_id'),
    isFolder: integer('is_folder', { mode: 'boolean' }).notNull().default(false),
    version: integer('version').notNull().default(1),
    createdBy: integer('created_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    updatedBy: integer('updated_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at')
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'documents_parent_id_fk'
    }).onDelete('cascade'),
    spaceParentIdx: index('documents_space_parent_idx').on(table.spaceId, table.parentId),
    spaceUpdatedAtIdx: index('documents_space_updated_at_idx').on(table.spaceId, table.updatedAt)
  })
)

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    spaceId: integer('space_id').references(() => spaces.id, {
      onDelete: 'set null'
    }),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: integer('target_id'),
    meta: text('meta'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => ({
    spaceCreatedAtIdx: index('audit_logs_space_created_at_idx').on(table.spaceId, table.createdAt),
    userCreatedAtIdx: index('audit_logs_user_created_at_idx').on(table.userId, table.createdAt)
  })
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Space = typeof spaces.$inferSelect
export type NewSpace = typeof spaces.$inferInsert
export type SpaceMember = typeof spaceMembers.$inferSelect
export type NewSpaceMember = typeof spaceMembers.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
