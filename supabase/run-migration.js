/**
 * Migration runner — uses Supabase service role to run SQL via the rpc endpoint.
 * 
 * Usage: node supabase/run-migration.js
 * 
 * NOTE: If this fails (Supabase doesn't expose raw SQL via REST by default),
 * paste supabase/migrations/001_initial_schema.sql into the Supabase SQL Editor manually.
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sql = fs.readFileSync(
  path.join(__dirname, 'migrations', '001_initial_schema.sql'),
  'utf8'
)

async function runMigration() {
  console.log('Running migration via Supabase REST API...')
  console.log('URL:', SUPABASE_URL)

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('RPC exec_sql not available (expected for most projects).')
    console.error('Response:', text)
    console.log('\n📋 MANUAL STEPS:')
    console.log('1. Go to: https://supabase.com/dashboard/project/sbtcbqdmbdfpbbflljwr/sql/new')
    console.log('2. Paste the contents of: supabase/migrations/001_initial_schema.sql')
    console.log('3. Click RUN')
    console.log('4. Then go to: Authentication → Email → Disable "Confirm email"')
    return
  }

  const data = await response.json()
  console.log('Migration result:', data)
}

runMigration().catch(console.error)
