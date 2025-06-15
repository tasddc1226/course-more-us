import { redirect, type ActionFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '~/lib/supabase.server'

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  // 모든 세션 정리 (로컬 + 원격)
  await supabase.auth.signOut({ scope: 'global' })
  
  // 모든 Supabase 관련 쿠키 정리
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token',
    'sb-kowavokdpjawkkkxnzib-auth-token',
    'sb-kowavokdpjawkkkxnzib-auth-token-code-verifier'
  ]
  
  cookiesToClear.forEach(cookieName => {
    response.headers.append('Set-Cookie', `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`)
    response.headers.append('Set-Cookie', `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`)
  })
  
  return redirect('/auth/login', {
    headers: response.headers,
  })
}

export async function loader() {
  return redirect('/')
}

export default function Logout() {
  return null
} 