import { redirect } from '@remix-run/node'
import { createSupabaseServerClient } from './supabase.server'
import { ROUTES } from '~/constants/routes'

export async function requireAuth(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      const url = new URL(request.url)
      const redirectTo = url.pathname + url.search
      throw redirect(`${ROUTES.LOGIN}?redirectTo=${encodeURIComponent(redirectTo)}`)
    }

    return { user, supabase }
  } catch (error) {
    console.error('RequireAuth catch error:', error)
    // redirect Response는 그대로 던져줌
    if (error instanceof Response) {
      throw error
    }
    // 다른 에러는 홈으로 리다이렉트
    throw redirect(`${ROUTES.HOME}?error=auth_failed`)
  }
}

export async function getUser(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user || null
} 