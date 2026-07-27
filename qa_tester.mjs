import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key'

// Fake user details
const testEmail = `qa_tester_${Date.now()}@gymplanner.ai`
const testPassword = 'TestPassword123!'

async function runTests() {
  console.log('🧪 Starting QA Automated Tests...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // 1. Create a fake user
  console.log(`\n[1] Registering test user: ${testEmail}`)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  })
  
  if (authError) {
    console.error('❌ Failed to register user:', authError.message)
    return
  }
  
  const user = authData.user
  console.log('✅ User registered successfully:', user.id)
  
  // 2. Test Admin API Bypass (Security Test)
  console.log('\n[2] Testing Admin API Security (Should return 401/403)')
  try {
    const res = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Cookie': `sb-access-token=${authData.session?.access_token}`
      }
    })
    const status = res.status
    if (status === 401 || status === 403) {
      console.log('✅ Security Test Passed. Admin API is protected. Status:', status)
    } else {
      console.error('❌ Security Test Failed! API is exposed. Status:', status)
    }
  } catch (e) {
    console.error('❌ Failed to ping Admin API:', e)
  }

  console.log('\n🎉 QA Automated Tests Completed!')
}

runTests()
