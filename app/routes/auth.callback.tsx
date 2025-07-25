import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '~/lib/supabase.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorCode = url.searchParams.get('error_code')
  const errorDescription = url.searchParams.get('error_description')
  const marketingAgreed = url.searchParams.get('marketing_agreed') === 'true'
  const type = url.searchParams.get('type') // 'signup' for email verification

  // 에러가 있는 경우 - 이메일 인증 관련 에러 처리
  if (error) {
    console.log('Callback error:', { error, errorCode, errorDescription, type })
    
    // 이메일 인증 관련 에러 처리
    if (type === 'signup' && (errorCode === 'otp_expired' || error === 'access_denied')) {
      return redirect(`/auth/verify-email?error=expired&email=${encodeURIComponent(url.searchParams.get('email') || '')}`)
    }
    
    return redirect(`/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const response = new Response()
    const supabase = createSupabaseServerClient(request, response)
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        // 토큰 관련 에러의 경우 세션을 클리어하고 로그인 페이지로 리다이렉트
        if (exchangeError.message.includes('refresh_token_not_found') || 
            exchangeError.message.includes('Invalid Refresh Token')) {
          await supabase.auth.signOut()
          return redirect('/auth/login?error=session_expired', {
            headers: response.headers,
          })
        }
        return redirect(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, {
          headers: response.headers,
        })
      }
      
      if (data.user) {
        // 이메일 인증을 통한 회원가입 완료인 경우
        if (type === 'signup') {
          // 이메일 인증 완료 후 약관 동의 페이지로 이동
          return redirect('/auth/terms?provider=email&user_authenticated=true' + 
            (marketingAgreed ? '&marketing_agreed=true' : ''), {
            headers: response.headers,
          })
        }
        
        // 기존 사용자의 동의 정보 확인 (소셜 로그인)
        try {
          const { data: existingAgreements, error: agreementError } = await supabase
            .from('user_agreements')
            .select('terms_agreed, privacy_agreed')
            .eq('user_id', data.user.id)
            .single()
          
          // 이미 필수 약관에 동의한 사용자는 바로 메인 페이지로 이동
          if (!agreementError && existingAgreements && 
              existingAgreements.terms_agreed && existingAgreements.privacy_agreed) {
            return redirect('/', {
              headers: response.headers,
            })
          }
        } catch (error) {
          // 동의 정보 조회 실패 시 새 사용자로 간주하고 약관 동의 페이지로 이동
  
        }
        
        // 새 사용자이거나 약관 동의가 필요한 경우 약관 동의 페이지로 이동
        return redirect('/auth/terms?provider=kakao&user_authenticated=true' + 
          (marketingAgreed ? '&marketing_agreed=true' : ''), {
          headers: response.headers,
        })
      }
    } catch (error) {
      console.error('Callback error:', error)
      // 모든 세션 정보를 클리어하고 로그인 페이지로 리다이렉트
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('Sign out error:', signOutError)
      }
      return redirect('/auth/login?error=callback_error', {
        headers: response.headers,
      })
    }
  }

  // 에러가 있거나 code가 없으면 로그인 페이지로 리다이렉트
  return redirect('/auth/login?error=no_code')
} 