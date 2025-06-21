import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link, useNavigate } from '@remix-run/react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { useState, useEffect } from 'react'
import { Button, Input } from '~/components/ui'
import { ROUTES } from '~/constants/routes'
import { isValidEmail, isValidPassword } from '~/utils/validation'
import { useSocialLogin } from '~/hooks/useSocialLogin'
import SocialLoginButton from '~/components/common/SocialLoginButton'

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
  const [countdown, setCountdown] = useState(3)
  
  // 소셜 로그인 공통 훅 사용
  const { handleSocialLogin, isLoading: isSocialLoading } = useSocialLogin({
    flow: 'signup'
  })

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

            <div className="mt-6 space-y-3">
              {/* 구글 로그인 */}
              <SocialLoginButton
                provider="google"
                isLoading={isSocialLoading('google')}
                onClick={() => handleSocialLogin('google')}
                mode="signup"
              />

              {/* 카카오 로그인 */}
              <SocialLoginButton
                provider="kakao"
                isLoading={isSocialLoading('kakao')}
                onClick={() => handleSocialLogin('kakao')}
                mode="signup"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 