import { redirect } from '@remix-run/node'
import { createSupabaseServerClient } from './supabase.server'

export async function requireAuth(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    throw redirect('/auth/login')
  }

  return { user: session.user, supabase }
}

export async function getUser(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.user || null
} 