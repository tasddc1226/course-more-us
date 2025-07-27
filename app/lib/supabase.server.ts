import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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

/**
 * 서버 환경에서 관리자 권한으로 Supabase와 상호작용하기 위한 클라이언트입니다.
 * RLS 정책을 우회해야 하는 경우에만 사용해야 합니다.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export { createSupabaseServerClient as createClient } 