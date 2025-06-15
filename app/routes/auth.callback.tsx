import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '~/lib/supabase.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const next = url.searchParams.get('next') || '/'

  // OAuth 에러가 있는 경우
  if (error) {
    return redirect(`/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const response = new Response()
    const supabase = createSupabaseServerClient(request, response)
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        return redirect(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
      }
      
      if (data.user) {
        return redirect(next, {
          headers: response.headers,
        })
      }
    } catch (error) {
      return redirect('/auth/login?error=callback_error')
    }
  }

  // 에러가 있거나 code가 없으면 로그인 페이지로 리다이렉트
  return redirect('/auth/login?error=no_code')
} 