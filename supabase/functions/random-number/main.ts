interface RandomNumberResponse {
  number: number
  min: number
  max: number
}

const createErrorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

Deno.serve((req) => {
  try {
    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405)
    }

    const url = new URL(req.url)
    const min = Number(url.searchParams.get('min') ?? 1)
    const max = Number(url.searchParams.get('max') ?? 100)

    if (isNaN(min) || isNaN(max)) {
      return createErrorResponse('min and max must be numbers', 400)
    }

    if (min >= max) {
      return createErrorResponse('min must be less than max', 400)
    }

    const randomNumber = generateRandomNumber(min, max)

    const response: RandomNumberResponse = {
      number: randomNumber,
      min,
      max
    }

    return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return createErrorResponse((error as Error).message, 500)
  }
})
