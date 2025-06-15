import { redirect, type ActionFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '~/lib/supabase.server'

export async function action({ request }: ActionFunctionArgs) {
  const supabase = createSupabaseServerClient(request)
  await supabase.auth.signOut()
  return redirect('/auth/login')
}

export async function loader() {
  return redirect('/')
}

export default function Logout() {
  return null
} 