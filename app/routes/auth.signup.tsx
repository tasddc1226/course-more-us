import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link, useNavigate } from '@remix-run/react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { createSupabaseClient } from '~/lib/supabase.client'
import { useState, useEffect } from 'react'
import { Button, Input } from '~/components/ui'
import { ROUTES } from '~/constants/routes'
import { isValidEmail, isValidPassword } from '~/utils/validation'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (user) {
    return redirect('/')
  }
  
  const url = new URL(request.url);
  const termsAgreed = url.searchParams.get('terms_agreed');
  
  // 이용약관 동의하지 않고 접근하면 약관 페이지로 리다이렉트
  if (!termsAgreed) {
    return redirect(`${ROUTES.TERMS}?next=${encodeURIComponent(ROUTES.SIGNUP)}`);
  }
  
  return json({ termsAgreed });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  // URL에서 동의 정보 가져오기
  const url = new URL(request.url)
  const marketingAgreed = url.searchParams.get('marketing_agreed') === 'true'

  if (!email || !password || !confirmPassword) {
    return json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return json({ error: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 })
  }

  if (!isValidPassword(password)) {
    return json({ error: '비밀번호는 8자 이상이며, 대소문자와 숫자를 포함해야 합니다.' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return json({ error: error.message }, { status: 400 })
  }

  // 회원가입 성공 시 동의 정보 저장 시도
  if (data.user) {
    try {
      // 임시 인증 request 생성 (실제로는 이메일 확인 후 로그인 시 저장됨)
      console.log('회원가입 완료, 이메일 확인 후 동의 정보가 저장됩니다.')
    } catch (agreementError) {
      console.error('동의 정보 저장 예약 실패:', agreementError)
    }
  }

  return json({ 
    success: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
    marketingAgreed 
  })
}

export default function Signup() {
  const actionData = useActionData<typeof action>()
  const navigate = useNavigate()
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // 회원가입 성공 시 카운트다운 및 리다이렉트
  useEffect(() => {
    if (actionData && 'success' in actionData) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate(ROUTES.LOGIN)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [actionData, navigate])

  const handleKakaoLogin = async () => {
    if (isKakaoLoading) return // 중복 클릭 방지
    
    setIsKakaoLoading(true)
    try {
      // 클라이언트에서 직접 카카오 OAuth 처리
      const supabase = createSupabaseClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=signup`,
        },
      })
      
      if (error) {
        console.error('카카오 로그인 오류:', error)
        alert('카카오 로그인 중 오류가 발생했습니다: ' + error.message)
        setIsKakaoLoading(false)
        return
      }
      
      // OAuth 리다이렉트가 성공적으로 시작되면 로딩 상태는 유지
      console.log('카카오 로그인 시작됨')
      
    } catch (error) {
      console.error('카카오 로그인 예외:', error)
      alert('카카오 로그인 중 예외가 발생했습니다.')
      setIsKakaoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">
            코스모스 회원가입
          </h2>
          <p className="text-white/90">
            특별한 데이트 코스를 함께 시작해보세요
          </p>
          <p className="mt-4 text-sm text-white/80">
            이미 계정이 있으신가요?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium text-white underline hover:text-white/80"
            >
              로그인하기
            </Link>
          </p>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <Form className="space-y-6" method="post">
          <div className="space-y-4">
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="이메일 주소"
              label="이메일"
            />
            
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="비밀번호 (8자 이상, 대소문자+숫자)"
              label="비밀번호"
              helperText="8자 이상, 대소문자와 숫자를 포함해야 합니다"
            />
            
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="비밀번호 확인"
              label="비밀번호 확인"
            />
          </div>

          {actionData && 'error' in actionData && (
            <div className="text-red-600 text-sm text-center">
              {actionData.error}
            </div>
          )}

          {actionData && 'success' in actionData && (
            <div className="text-green-600 text-sm text-center bg-green-50 py-3 px-4 rounded-lg">
              <div className="font-medium">{actionData.success}</div>
              <div className="mt-2 text-xs">
                {countdown > 0 ? `${countdown}초 후 로그인 페이지로 이동합니다...` : '이동 중...'}
              </div>
            </div>
          )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              회원가입
            </Button>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleKakaoLogin}
                disabled={isKakaoLoading}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm bg-yellow-400 text-sm font-medium text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 transition-all"
              >
                {isKakaoLoading ? (
                  '카카오 로그인 중...'
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                    </svg>
                    카카오로 시작하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 