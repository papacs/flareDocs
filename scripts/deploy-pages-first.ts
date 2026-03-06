import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

type DeployOptions = {
  projectName?: string
  productionBranch: string
  d1DatabaseId?: string
  r2Bucket?: string
  r2PreviewBucket?: string
  authSecret?: string
  bootstrapAdminPassword?: string
  skipBuild: boolean
  skipMigrate: boolean
  skipProjectCreate: boolean
  skipSetup: boolean
  dryRun: boolean
}

type CommandResult = {
  code: number
  output: string
}

function parseArgs(argv: string[]): DeployOptions {
  const options: DeployOptions = {
    productionBranch: 'main',
    skipBuild: false,
    skipMigrate: false,
    skipProjectCreate: false,
    skipSetup: false,
    dryRun: false
  }

  for (const argument of argv) {
    if (argument === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (argument === '--skip-build') {
      options.skipBuild = true
      continue
    }

    if (argument === '--skip-migrate') {
      options.skipMigrate = true
      continue
    }

    if (argument === '--skip-project-create') {
      options.skipProjectCreate = true
      continue
    }

    if (argument === '--skip-setup') {
      options.skipSetup = true
      continue
    }

    const [key, rawValue] = argument.split('=')
    const value = rawValue?.trim()

    if (!value) {
      continue
    }

    if (key === '--project-name') {
      options.projectName = value
    } else if (key === '--production-branch') {
      options.productionBranch = value
    } else if (key === '--d1-database-id') {
      options.d1DatabaseId = value
    } else if (key === '--r2-bucket') {
      options.r2Bucket = value
    } else if (key === '--r2-preview-bucket') {
      options.r2PreviewBucket = value
    } else if (key === '--auth-secret') {
      options.authSecret = value
    } else if (key === '--bootstrap-admin-password') {
      options.bootstrapAdminPassword = value
    }
  }

  return options
}

function generateHex(bytes: number) {
  return randomBytes(bytes).toString('hex')
}

function generateAdminPassword() {
  return `${generateHex(10)}A!9`
}

function assertOption(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`Missing required option ${key}.`)
  }
}

function runCommand(
  command: string,
  args: string[],
  options: { input?: string; allowFailure?: boolean; dryRun?: boolean }
): CommandResult {
  const printable = `${command} ${args.join(' ')}`.trim()
  console.log(`\n$ ${printable}`)

  if (options.dryRun) {
    return { code: 0, output: '' }
  }

  const result = spawnSync(command, args, {
    stdio: options.input === undefined ? 'pipe' : 'pipe',
    input: options.input,
    encoding: 'utf8'
  })

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`

  if (output.trim()) {
    console.log(output.trim())
  }

  const code = result.status ?? 1

  if (code !== 0 && !options.allowFailure) {
    throw new Error(`Command failed (${code}): ${printable}`)
  }

  return { code, output }
}

function ensureWranglerReady(projectRoot: string) {
  const wranglerPath = join(projectRoot, 'wrangler.toml')

  if (!existsSync(wranglerPath)) {
    throw new Error('wrangler.toml is missing after setup.')
  }

  const source = readFileSync(wranglerPath, 'utf8')

  if (source.includes('replace-with-your-d1-database-id')) {
    throw new Error('wrangler.toml still has placeholder `database_id`.')
  }

  if (source.includes('replace-with-your-r2-bucket')) {
    throw new Error('wrangler.toml still has placeholder `bucket_name`.')
  }
}

function upsertEnvValue(source: string, key: string, value: string) {
  if (source.match(new RegExp(`^${key}=`, 'm'))) {
    return source.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
  }

  return `${key}=${value}\n${source}`
}

function ensureTrailingNewline(value: string) {
  return value.endsWith('\n') ? value : `${value}\n`
}

function ensureEnvReady(projectRoot: string) {
  const envPath = join(projectRoot, '.env')

  if (!existsSync(envPath)) {
    throw new Error('.env is missing after setup.')
  }

  const source = readFileSync(envPath, 'utf8')

  if (!source.match(/^NUXT_AUTH_SECRET=.+$/m)) {
    throw new Error('.env missing `NUXT_AUTH_SECRET`.')
  }
}

function readEnvValue(source: string, key: string) {
  const value = source.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim()
  return value || ''
}

const options = parseArgs(process.argv.slice(2))
const projectRoot = process.cwd()

assertOption(options.projectName, '--project-name')

const bootstrapAdminPassword =
  options.bootstrapAdminPassword || process.env.NUXT_BOOTSTRAP_ADMIN_PASSWORD || generateAdminPassword()

if (!options.skipSetup) {
  const setupArgs = ['project:setup', '--']

  if (options.d1DatabaseId) {
    setupArgs.push(`--d1-database-id=${options.d1DatabaseId}`)
  }

  if (options.r2Bucket) {
    setupArgs.push(`--r2-bucket=${options.r2Bucket}`)
  }

  if (options.r2PreviewBucket) {
    setupArgs.push(`--r2-preview-bucket=${options.r2PreviewBucket}`)
  }

  if (options.dryRun) {
    setupArgs.push('--dry-run')
  }

  runCommand('pnpm', setupArgs, { dryRun: options.dryRun })
}

let authSecret = options.authSecret || process.env.NUXT_AUTH_SECRET || ''

if (!options.dryRun) {
  ensureEnvReady(projectRoot)
  ensureWranglerReady(projectRoot)

  const envPath = join(projectRoot, '.env')
  const envSource = readFileSync(envPath, 'utf8')
  authSecret = authSecret || readEnvValue(envSource, 'NUXT_AUTH_SECRET') || generateHex(32)
  const nextEnv = ensureTrailingNewline(
    upsertEnvValue(
      upsertEnvValue(envSource, 'NUXT_AUTH_SECRET', authSecret),
      'NUXT_BOOTSTRAP_ADMIN_PASSWORD',
      bootstrapAdminPassword
    )
  )
  writeFileSync(envPath, nextEnv)
} else {
  authSecret = authSecret || generateHex(32)
}

const whoamiResult = runCommand('pnpm', ['wrangler', 'whoami'], {
  allowFailure: true,
  dryRun: options.dryRun
})

if (whoamiResult.code !== 0) {
  console.warn(
    'Warning: `wrangler whoami` failed in this shell. Continuing deployment and relying on subsequent wrangler commands.'
  )
}

if (!options.skipProjectCreate) {
  const createResult = runCommand(
    'pnpm',
    [
      'wrangler',
      'pages',
      'project',
      'create',
      options.projectName!,
      '--production-branch',
      options.productionBranch
    ],
    { allowFailure: true, dryRun: options.dryRun }
  )

  const lowerOutput = createResult.output.toLowerCase()
  const projectExists =
    createResult.code !== 0 &&
    (lowerOutput.includes('already exists') || lowerOutput.includes('a project with this name already exists'))

  if (createResult.code !== 0 && !projectExists) {
    throw new Error(
      `Failed to create Pages project: ${options.projectName}\nWrangler output:\n${createResult.output || '(empty output)'}`
    )
  }
}

runCommand(
  'pnpm',
  ['wrangler', 'pages', 'secret', 'put', 'NUXT_AUTH_SECRET', '--project-name', options.projectName!],
  {
    input: `${authSecret}\n`,
    dryRun: options.dryRun
  }
)

runCommand(
  'pnpm',
  [
    'wrangler',
    'pages',
    'secret',
    'put',
    'NUXT_BOOTSTRAP_ADMIN_PASSWORD',
    '--project-name',
    options.projectName!
  ],
  {
    input: `${bootstrapAdminPassword}\n`,
    dryRun: options.dryRun
  }
)

if (!options.skipMigrate) {
  runCommand('pnpm', ['db:migrate:remote'], { dryRun: options.dryRun })
}

if (!options.skipBuild) {
  runCommand('pnpm', ['build'], { dryRun: options.dryRun })
}

runCommand(
  'pnpm',
  [
    'wrangler',
    'pages',
    'deploy',
    'dist',
    '--project-name',
    options.projectName!,
    '--branch',
    options.productionBranch
  ],
  { dryRun: options.dryRun }
)

console.log('\nDeployment flow completed.')
console.log(`Pages project: ${options.projectName}`)
console.log(`Production branch: ${options.productionBranch}`)
console.log('Secrets pushed: NUXT_AUTH_SECRET, NUXT_BOOTSTRAP_ADMIN_PASSWORD')
console.log('')
console.log('If this is your first admin bootstrap, login with:')
console.log('username: admin')
console.log(`password: ${bootstrapAdminPassword}`)
console.log('After first successful admin login, rotate and unset NUXT_BOOTSTRAP_ADMIN_PASSWORD in Pages.')
