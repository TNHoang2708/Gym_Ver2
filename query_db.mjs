import { Client } from 'pg'

const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
})

async function queryDB() {
  try {
    await client.connect()
    
    // Check users
    const usersRes = await client.query('SELECT id, email FROM auth.users;')
    console.log("Users:")
    console.table(usersRes.rows)

    // Check roles
    const rolesRes = await client.query('SELECT user_id, role FROM public.user_roles;')
    console.log("\nRoles:")
    console.table(rolesRes.rows)

  } catch (err) {
    console.error("Error connecting to DB:", err.message)
  } finally {
    await client.end()
  }
}

queryDB()
