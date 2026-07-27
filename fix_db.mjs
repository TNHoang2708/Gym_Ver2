import { Client } from 'pg'

const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
})

async function fix() {
  try {
    await client.connect()
    
    // Drop the recursive policies from 027
    await client.query(`DROP POLICY IF EXISTS "Admins_Force_View_Memory" ON public.user_memory;`)
    await client.query(`DROP POLICY IF EXISTS "Admins_Force_View_WorkoutLogs" ON public.workout_logs;`)
    await client.query(`DROP POLICY IF EXISTS "Admins_Force_View_FoodLogs" ON public.food_logs;`)
    await client.query(`DROP POLICY IF EXISTS "Admins_Force_View_Sessions" ON public.workout_session_logs;`)
    
    // Also drop from 015 just in case
    await client.query(`DROP POLICY IF EXISTS "Admins can view all user memory" ON public.user_memory;`)
    
    // Create safe policy
    await client.query(`
      CREATE POLICY "Admins can view all user memory" ON public.user_memory FOR SELECT
      USING ( public.is_admin() );
    `)
    
    console.log("Successfully fixed RLS policies in the active database.")
  } catch (err) {
    console.error("Error fixing DB:", err)
  } finally {
    await client.end()
  }
}

fix()
