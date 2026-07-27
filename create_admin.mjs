import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read env vars
const envFile = fs.readFileSync('.env.local', 'utf8')
const envUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const envKeyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)

const supabaseUrl = envUrlMatch[1].trim()
const supabaseKey = envKeyMatch[1].trim()

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  const email = 'admin@gymplanner.ai'
  const password = 'admin123456'

  console.log('Creating admin user...')
  
  // 1. Create or get user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // bypass email verification
  })

  let userId = authData?.user?.id

  if (authError) {
    if (authError.code === 'email_exists' || authError.message.includes('registered')) {
      console.log('User already exists, fetching user ID...')
      // If user exists, we need to get their ID to make them admin
      // Since it's a test script, we can just delete and recreate to ensure password is correct
      const { data: listData } = await supabase.auth.admin.listUsers()
      const existingUser = listData.users.find(u => u.email === email)
      
      if (existingUser) {
        // Update password just in case
        await supabase.auth.admin.updateUserById(existingUser.id, { password })
        userId = existingUser.id
      }
    } else {
      console.error('Error creating user:', authError)
      return
    }
  }

  if (!userId) {
    console.error('Could not get user ID')
    return
  }

  console.log('User ID:', userId)
  console.log('Granting admin role...')

  // 2. Assign admin role in user_memory
  const { error: roleError } = await supabase
    .from('user_memory')
    .upsert({ user_id: userId, is_admin: true }, { onConflict: 'user_id' })

  if (roleError) {
    console.error('Error assigning role:', roleError)
  } else {
    console.log('SUCCESS!')
    console.log('Email:', email)
    console.log('Password:', password)
  }
}

createAdmin()
