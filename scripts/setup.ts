import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type SetupOptions = {
  authSecret?: string
  d1DatabaseId?: string
  dryRun: boolean
  r2Bucket?: string
  r2PreviewBucket?: string
}

function parseArgs(argv: string[]): SetupOptions {
  const options: SetupOptions = {
    dryRun: false
  }

  for (const argument of argv) {
    if (argument === '--dry-run') {
      options.dryRun = true
      continue
    }

    const [key, rawValue] = argument.split('=')
    const value = rawValue?.trim()

    if (!value) {
      continue
    }

    if (key === '--auth-secret') {
      options.authSecret = value
    } else if (key === '--d1-database-id') {
      options.d1DatabaseId = value
    } else if (key === '--r2-bucket') {
      options.r2Bucket = value
    } else if (key === '--r2-preview-bucket') {
      options.r2PreviewBucket = value
    }
  }

  return options
}

function ensureTrailingNewline(value: string) {
  return value.endsWith('\n') ? value : `${value}\n`
}

function updateEnvFile(source: string, authSecret: string) {
  const nextSource = source.match(/^NUXT_AUTH_SECRET=/m)
    ? source.replace(/^NUXT_AUTH_SECRET=.*$/m, `NUXT_AUTH_SECRET=${authSecret}`)
    : `NUXT_AUTH_SECRET=${authSecret}\n${source}`

  return ensureTrailingNewline(nextSource)
}

function replaceTomlValue(source: string, key: string, value?: string) {
  if (!value) {
    return source
  }

  const pattern = new RegExp(`^${key} = \".*\"$`, 'm')

  if (!pattern.test(source)) {
    return source
  }

  return source.replace(pattern, `${key} = "${value}"`)
}

function summarizePending(label: string, value?: string) {
  return value ? `${label}: ${value}` : `${label}: still using placeholder`
}

const options = parseArgs(process.argv.slice(2))
const projectRoot = process.cwd()
const envExamplePath = join(projectRoot, '.env.example')
const envPath = join(projectRoot, '.env')
const wranglerExamplePath = join(projectRoot, 'wrangler.toml.example')
const wranglerPath = join(projectRoot, 'wrangler.toml')

if (!existsSync(envExamplePath)) {
  throw new Error('Missing .env.example. Run this script from the project root.')
}

if (!existsSync(wranglerPath) && !existsSync(wranglerExamplePath)) {
  throw new Error('Missing wrangler.toml.example. Run this script from the project root.')
}

const envTemplate = readFileSync(envExamplePath, 'utf8')
const existingEnv = existsSync(envPath) ? readFileSync(envPath, 'utf8') : envTemplate
const existingAuthSecret = (existingEnv.match(/^NUXT_AUTH_SECRET=(.*)$/m)?.[1] || '').trim()
const authSecret =
  options.authSecret || existingAuthSecret || randomBytes(32).toString('hex')

const nextEnv = updateEnvFile(existingEnv, authSecret)

const wranglerSource = readFileSync(existsSync(wranglerPath) ? wranglerPath : wranglerExamplePath, 'utf8')
const nextWrangler = [
  ['database_id', options.d1DatabaseId],
  ['bucket_name', options.r2Bucket],
  ['preview_bucket_name', options.r2PreviewBucket]
] as const

const updatedWrangler = nextWrangler.reduce(
  (currentSource, [key, value]) => replaceTomlValue(currentSource, key, value),
  wranglerSource
)

if (!options.dryRun) {
  writeFileSync(envPath, nextEnv)
  writeFileSync(wranglerPath, updatedWrangler)
}

console.log(options.dryRun ? 'Dry run only. No files were changed.' : 'Setup files updated.')
console.log(`.env ${existsSync(envPath) ? 'updated' : 'prepared'} at ${envPath}`)
console.log(`wrangler.toml ready at ${wranglerPath}`)
console.log(summarizePending('D1 database id', options.d1DatabaseId))
console.log(summarizePending('R2 bucket', options.r2Bucket))
console.log(summarizePending('R2 preview bucket', options.r2PreviewBucket))
console.log('')
console.log('Next steps:')
console.log('1. Create the D1 database: pnpm wrangler d1 create flaredocs-db')
console.log('2. Create the R2 bucket: pnpm wrangler r2 bucket create <your-bucket>')
console.log('3. Re-run this script with the resulting ids and bucket names if placeholders remain')
console.log('4. Apply local migrations: pnpm db:migrate:local')
console.log('5. Start development: pnpm dev')
