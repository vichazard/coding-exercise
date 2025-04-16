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
  await client.query(
    `delete from public.courses_likes where course_id = ANY(select id from public.courses where title = 'Test Course')`
  )
  await client.query(`delete from public.courses where title = 'Test Course'`)
  const usersToDelete = await client.query(`select id from auth.users where email like '%${TEST_EMAIL_DOMAIN}'`)
  const userIds = usersToDelete.rows.map((u) => u.id)
  await client.query(`delete from public.users where auth_user_id = ANY($1)`, [userIds])
  await client.query(`delete from auth.users where id = ANY($1)`, [userIds])
})

const login = async (user: string): Promise<[SupabaseClient, string]> => {
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
      },
      auth: {
        persistSession: false
      }
    }),
    session.user.id
  ]
}

const createUser = async (user: string): Promise<string> => {
  const email = `${user}${TEST_EMAIL_DOMAIN}`
  const {
    data: { user: authUser },
    error: authError
  } = await serviceClient.auth.admin.createUser({
    email,
    password: 'asdfasdf',
    email_confirm: true
  })
  if (authError) {
    throw new Error(`Error creating user ${email}: ${authError.message}`)
  }
  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single()
  if (userError) {
    throw new Error(`Error creating user ${email}: ${userError.message}`)
  }
  return userData.id
}

const createCourse = async (): Promise<string> => {
  const { data, error: courseError } = await serviceClient
    .from('courses')
    .insert({ title: 'Test Course', active: true })
    .select('id')
    .single()
  if (courseError) {
    throw new Error(`Error creating course: ${courseError.message}`)
  }
  return data.id
}

const createCourseLike = async (user: string, courseId: string): Promise<void> => {
  const { error: courseLikeError } = await serviceClient
    .from('courses_likes')
    .insert({ user_id: user, course_id: courseId, created_at: new Date() })
    .select('user_id, course_id')
    .single()
  if (courseLikeError) {
    throw new Error(`Error creating course like for user ${user} and course ${courseId}: ${courseLikeError.message}`)
  }
}

describe('RLS on courses likes', () => {
  it('users can see their own liked courses', async () => {
    const user1Id = await createUser('test1')
    const user2Id = await createUser('test2')
    const course1Id = await createCourse()
    const course2Id = await createCourse()
    const [userClient] = await login('test1')

    await createCourseLike(user1Id, course1Id)
    await createCourseLike(user2Id, course2Id)

    const { data: likes, error } = await userClient.from('courses_likes').select('*').eq('user_id', user1Id)

    expect(error).toBeNull()
    expect(likes.length).toBe(1)
    expect(likes[0].course_id).toBe(course1Id)
  })
  it('users cannot see other users liked courses', async () => {
    const user1Id = await createUser('test1')
    const user2Id = await createUser('test2')
    const course1Id = await createCourse()
    const course2Id = await createCourse()

    await createCourseLike(user1Id, course1Id)
    await createCourseLike(user2Id, course2Id)

    const [userClient] = await login('test1')

    const { data: likes, error } = await userClient.from('courses_likes').select('*').eq('user_id', user2Id)

    expect(error).toBeNull()
    expect(likes.length).toBe(0)
  })
})

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
