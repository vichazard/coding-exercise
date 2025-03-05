import { Pool, PoolClient } from 'pg'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let pool: Pool
let client: PoolClient
const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
})
const serviceClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  }
})

const TEST_EMAIL_DOMAIN = '@example.com'

beforeAll(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  client = await pool.connect()
})

beforeEach(async () => {
  // Clear out the database except for the seed data
  const usersToDelete = await client.query(`select id from auth.users where email like '%${TEST_EMAIL_DOMAIN}'`)
  const userIds = usersToDelete.rows.map((u) => u.id)
  await client.query(`delete from public.users where auth_user_id = ANY($1)`, [userIds])
  await client.query(`delete from auth.users where id = ANY($1)`, [userIds])
})

const login = async (user: 'user' | 'admin'): Promise<[SupabaseClient, string]> => {
  const {
    data: { session }
  } = await anonClient.auth.signInWithPassword({
    email: `${user}${TEST_EMAIL_DOMAIN}`,
    password: 'asdfasdf'
  })
  return [
    createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    }),
    session.user.id
  ]
}

describe('users', () => {
  // Create some test users, then login as one of them and try to view the other one's data (should fail)
  it.todo('users can only view their own data')

  // use the serviceClient and select all users
  it.todo('super admins should be able to view all users')
})

describe('registration', () => {
  it('can self register', async () => {
    const email = `test${TEST_EMAIL_DOMAIN}`
    await anonClient.auth.signUp({
      email,
      password: 'asdfasdf'
    })
    const { rows: users } = await client.query('select id from auth.users where email = $1', [email])
    expect(users.length).toBe(1)
    const { rows: userProfiles } = await client.query('select * from public.users where auth_user_id = $1', [
      users[0].id
    ])
    expect(userProfiles.length).toBe(1)
    expect(userProfiles[0].auth_user_id).toBe(users[0].id)
  })
})

afterAll(async () => {
  await client.release()
  await pool.end()
})
