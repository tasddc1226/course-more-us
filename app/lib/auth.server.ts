import { redirect } from '@remix-run/node'
import { createSupabaseServerClient } from './supabase.server'

export async function requireAuth(request: Request) {
  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    const url = new URL(request.url)
    const redirectTo = url.pathname + url.search
    throw redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  return { user, supabase }
}

export async function getUser(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user || null
} 