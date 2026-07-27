import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data: { user }, error: authError } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@test.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('Auth error:', authError)
    return
  }
  
  console.log('User created:', user?.id)
  
  const { data, error } = await supabase
    .from('user_memory')
    .upsert({
      user_id: user?.id,
      hard_memory: {},
      soft_memory: {},
      session_meta: { onboarding_completed: true },
    }, { onConflict: 'user_id' })
    
  if (error) {
    console.error('Upsert error:', error)
  } else {
    console.log('Upsert success!')
  }
}

test()
