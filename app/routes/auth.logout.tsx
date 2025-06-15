import { redirect, type ActionFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '~/lib/supabase.server'

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  await supabase.auth.signOut()
  return redirect('/', {
    headers: response.headers,
  })
}

export async function loader() {
  return redirect('/')
}

export default function Logout() {
  return null
} 