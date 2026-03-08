import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { DatabaseSync } from 'node:sqlite'
import { hashPassword } from '../app/server/utils/password.ts'

type CliArgs = {
  username: string
  password: string
  dbFile?: string
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  pnpm users:reset-password:local <username> <newPassword>',
      '',
      'Optional:',
      '  --db-file <path-to-local-d1-sqlite>'
    ].join('\n')
  )
}

function parseArgs(argv: string[]): CliArgs | 'help' | null {
  const positional: string[] = []
  let dbFile: string | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--help' || token === '-h') {
      return 'help'
    }

    if (token === '--db-file') {
      const next = argv[index + 1]

      if (!next) {
        throw new Error('Missing value for --db-file')
      }

      dbFile = next
      index += 1
      continue
    }

    positional.push(token)
  }

  if (positional.length < 2) {
    return null
  }

  const [username, password] = positional
  return { username, password, dbFile }
}

function discoverLocalD1File() {
  const targetDir = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject')

  if (!existsSync(targetDir)) {
    throw new Error(
      'Local D1 directory not found. Run `pnpm dev` once or pass --db-file manually.'
    )
  }

  const candidates = readdirSync(targetDir)
    .filter((name) => name.endsWith('.sqlite'))
    .map((name) => join(targetDir, name))
    .map((filePath) => ({
      filePath,
      mtime: statSync(filePath).mtimeMs
    }))
    .sort((left, right) => right.mtime - left.mtime)

  if (!candidates.length) {
    throw new Error(
      'No local D1 sqlite file found. Run `pnpm dev` once or pass --db-file manually.'
    )
  }

  return candidates[0].filePath
}

async function main() {
  try {
    const parsed = parseArgs(process.argv.slice(2))

    if (parsed === 'help') {
      printUsage()
      return
    }

    if (!parsed) {
      printUsage()
      process.exitCode = 1
      return
    }

    const { username, password, dbFile } = parsed
    const normalizedUsername = username.trim()

    if (!normalizedUsername) {
      throw new Error('Username cannot be empty.')
    }

    if (password.length < 8 || password.length > 128) {
      throw new Error('Password must be 8-128 characters.')
    }

    const sqliteFile = dbFile ? resolve(dbFile) : discoverLocalD1File()

    if (!existsSync(sqliteFile)) {
      throw new Error(`Database file not found: ${sqliteFile}`)
    }

    const db = new DatabaseSync(sqliteFile)

    try {
      const userRow = db
        .prepare('SELECT id FROM users WHERE username = ? LIMIT 1')
        .get(normalizedUsername) as { id?: number } | undefined

      if (!userRow?.id) {
        throw new Error(
          `User "${normalizedUsername}" not found in ${sqliteFile}`
        )
      }

      const passwordHash = await hashPassword(password)
      const result = db
        .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .run(passwordHash, userRow.id)

      if (!result.changes) {
        throw new Error('Password update did not modify any row.')
      }
    } finally {
      db.close()
    }

    console.log(
      `Password updated for "${normalizedUsername}" in local database: ${sqliteFile}`
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Reset failed: ${message}`)
    process.exitCode = 1
  }
}

void main()
