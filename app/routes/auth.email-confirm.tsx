import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { ROUTES } from '~/constants/routes'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const marketingAgreed = url.searchParams.get('marketing_agreed') === 'true'

  console.log('Email confirm params:', { token, tokenHash, type, marketingAgreed })

  if (!token && !tokenHash) {
    return redirect(`${ROUTES.LOGIN}?error=missing_token`)
  }

  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)

  try {
    let verifyResult

    // token_hash가 있는 경우 (권장 방식)
    if (tokenHash) {
      verifyResult = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'signup'
      })
    } 
    // token이 있는 경우 - PKCE 플로우 우회를 위해 session 생성 시도
    else if (token) {
      // 직접 exchangeCodeForSession 시도
      verifyResult = await supabase.auth.exchangeCodeForSession(token)
    }
    else {
      return redirect(`${ROUTES.LOGIN}?error=missing_token`)
    }

    const { data, error } = verifyResult

    if (error) {
      console.error('Email verification error:', error)
      
      // 토큰 만료 또는 무효한 경우
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return redirect(`${ROUTES.VERIFY_EMAIL}?error=expired`)
      }
      
      return redirect(`${ROUTES.LOGIN}?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user && data.session) {
      console.log('Email verification successful:', data.user.email)
      
      // 세션이 생성되었으므로 약관 동의 페이지로 이동
      return redirect(`/auth/terms?provider=email&user_authenticated=true${marketingAgreed ? '&marketing_agreed=true' : ''}`, {
        headers: response.headers,
      })
    }

    // 예상치 못한 상황
    return redirect(`${ROUTES.LOGIN}?error=verification_failed`)

  } catch (error) {
    console.error('Email confirmation error:', error)
    return redirect(`${ROUTES.LOGIN}?error=confirmation_error`)
  }
}

// 이 페이지는 자동 리다이렉트만 하므로 컴포넌트는 간단하게
export default function EmailConfirm() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">이메일 인증 처리 중...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    </div>
  )
} 