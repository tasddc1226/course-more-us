import { createServerClient } from '@supabase/ssr'
import { type Database } from '~/types/database.types'

export function createSupabaseServerClient(request: Request, response?: Response) {
  const cookies = request.headers.get('Cookie') || ''

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies
            .split(';')
            .map(cookie => cookie.trim().split('='))
            .filter(([name]) => name)
            .map(([name, value]) => ({ name, value: decodeURIComponent(value || '') }))
        },
        setAll(cookiesToSet) {
          if (response) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.headers.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; ${Object.entries(options || {}).map(([key, val]) => `${key}=${val}`).join('; ')}`)
            })
          }
        },
      },
    },
  )
} 