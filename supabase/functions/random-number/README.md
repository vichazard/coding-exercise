# Random Number Generator Function

## Purpose

This Deno serverless function generates a random number between a specified minimum and maximum value. It is designed to
be used in applications where random number generation is required, such as games, simulations, or any feature that
needs randomization.

## Expected Input/Output

### Input

The function expects a GET request with the following query parameters:

- `min` (optional): The minimum value for the random number generation. Defaults to 1 if not provided.
- `max` (optional): The maximum value for the random number generation. Defaults to 100 if not provided.

### Output

The function returns a JSON response with the following structure:

- `randomNumber`: The generated random number between the specified `min` and `max` values.
- `min`: The minimum value used for the generation.
- `max`: The maximum value used for the generation.

## How to run it locally

```bash
cd supabase/functions/random-number
cp .env.example .env
deno run dev

```

## How to run the test

```bash
deno run test
```

## How to deploy

```bash
supabase functions deploy random-number
```
