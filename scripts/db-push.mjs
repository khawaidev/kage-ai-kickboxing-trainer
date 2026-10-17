import 'dotenv/config'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const migrationsDir = join(root, 'supabase', 'migrations')

const url = process.env.SUPABASE_URL
const token = process.env.SUPABASE_ACCESS_TOKENS || process.env.SUPABASE_ACCESS_TOKEN

if (!url) {
  console.error('Missing SUPABASE_URL in .env')
  process.exit(1)
}
if (!token || !token.startsWith('sbp_')) {
  console.error('Missing SUPABASE_ACCESS_TOKENS (sbp_…) in .env')
  process.exit(1)
}

const ref = new URL(url).hostname.split('.')[0]
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.error('No migrations found in supabase/migrations')
  process.exit(1)
}

async function runQuery(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text}`)
  }
  return text
}

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  process.stdout.write(`Applying ${file} … `)
  try {
    await runQuery(sql)
    console.log('ok')
  } catch (error) {
    console.log('FAILED')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

console.log(`\nApplied ${files.length} migration(s) to project ${ref}.`)
