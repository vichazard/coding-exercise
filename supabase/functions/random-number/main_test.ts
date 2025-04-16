import { assertEquals } from 'https://deno.land/std@0.114.0/testing/asserts.ts'

Deno.test('GET /random-number should return a random number within the specified range', async () => {
  const min = 1
  const max = 10
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/random-number?min=${min}&max=${max}`)
  const data = await response.json()

  assertEquals(response.status, 200)
  assertEquals(data.min, min)
  assertEquals(data.max, max)
  assertEquals(data.number >= min && data.number <= max, true)
})

Deno.test('GET /random-number should return 400 for invalid min and max', async () => {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/random-number?min=invalid&max=10`)
  const data = await response.json()

  assertEquals(response.status, 400)
  assertEquals(data.error, 'min and max must be numbers')
})

Deno.test('GET /random-number should return 400 if min is greater than or equal to max', async () => {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/random-number?min=10&max=5`)
  const data = await response.json()

  assertEquals(response.status, 400)
  assertEquals(data.error, 'min must be less than max')
})

Deno.test('POST /random-number should return 405 Method Not Allowed', async () => {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/random-number`, {
    method: 'POST'
  })

  assertEquals(response.status, 405)
  const data = await response.json()
  assertEquals(data.error, 'Method not allowed')
})
