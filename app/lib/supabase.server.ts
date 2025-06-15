import { createServerClient } from '@supabase/ssr'
import { type Database } from '~/types/database.types'

export function createSupabaseServerClient(request: Request) {
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
          // 서버에서는 쿠키 설정을 직접 하지 않음
          // 대신 응답 헤더에서 설정해야 함
        },
      },
    },
  )
} 