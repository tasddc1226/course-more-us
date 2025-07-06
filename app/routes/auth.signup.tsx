import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link, useNavigate } from '@remix-run/react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { useState, useEffect } from 'react'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout, SocialLoginSection } from '~/components/common'
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
    options: {
      emailRedirectTo: `${url.origin}/auth/callback?type=signup&marketing_agreed=${marketingAgreed}`,
    },
  })

  console.log('SignUp Response:', { data, error })

  if (error) {
    console.error('SignUp Error:', error)
    return json({ error: error.message }, { status: 400 })
  }

  // 회원가입 성공 시 이메일 인증 대기 페이지로 리다이렉트
  if (data.user) {
    // 이메일 인증이 필요한 경우 (user는 생성되지만 email_confirmed_at이 null)
    if (!data.user.email_confirmed_at) {
      return redirect(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}&marketing_agreed=${marketingAgreed}`)
    }
    
    // 이메일 인증이 불필요한 경우 (개발 환경 등)
    try {
      // 동의 정보 저장 시도
    } catch (agreementError) {
      // 동의 정보 저장 예약 실패 시 에러 로깅
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
  
  // 이메일 중복확인 상태
  const [email, setEmail] = useState('')
  const [emailCheckStatus, setEmailCheckStatus] = useState<'unchecked' | 'checking' | 'available' | 'unavailable'>('unchecked')
  const [emailCheckMessage, setEmailCheckMessage] = useState('')

  // 이메일 중복확인 함수
  const checkEmailAvailability = async () => {
    if (!email || !isValidEmail(email)) {
      setEmailCheckStatus('unchecked')
      setEmailCheckMessage('올바른 이메일 형식을 입력해주세요.')
      return
    }

    setEmailCheckStatus('checking')
    setEmailCheckMessage('이메일 확인 중...')

    try {
      const formData = new FormData()
      formData.append('email', email)

      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.available) {
        setEmailCheckStatus('available')
        setEmailCheckMessage(result.message)
      } else {
        setEmailCheckStatus('unavailable')
        setEmailCheckMessage(result.message)
      }
    } catch (error) {
      setEmailCheckStatus('unchecked')
      setEmailCheckMessage('이메일 확인 중 오류가 발생했습니다.')
    }
  }

  // 이메일 입력 시 중복확인 상태 초기화
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailCheckStatus !== 'unchecked') {
      setEmailCheckStatus('unchecked')
      setEmailCheckMessage('')
    }
  }

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
    <AuthLayout
      title="코스모스 회원가입"
      subtitle="특별한 데이트 코스를 함께 시작해보세요"
      showSocialLogin={true}
      socialLoginComponent={
        <div>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>
          <SocialLoginSection mode="signup" />
        </div>
      }
    >
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-purple-600 hover:text-purple-500"
          >
            로그인하기
          </Link>
        </p>
      </div>

      <Form className="space-y-6" method="post">
        {/* 이메일 값을 Form에 전송하기 위한 hidden input */}
        <input type="hidden" name="email" value={email} />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <div className="flex gap-2">
              <Input
                id="email-address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="이메일 주소"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={checkEmailAvailability}
                disabled={!email || !isValidEmail(email) || emailCheckStatus === 'checking'}
                variant="outline"
                className="whitespace-nowrap"
              >
                {emailCheckStatus === 'checking' ? '확인중...' : '중복확인'}
              </Button>
            </div>
            
            {/* 이메일 중복확인 메시지 */}
            {emailCheckMessage && (
              <div className={`text-sm flex items-center gap-2 ${
                emailCheckStatus === 'available' ? 'text-green-600' : 
                emailCheckStatus === 'unavailable' ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {emailCheckStatus === 'available' && <span className="text-green-500">✓</span>}
                {emailCheckStatus === 'unavailable' && <span className="text-red-500">✗</span>}
                {emailCheckStatus === 'checking' && <span className="text-blue-500">🔄</span>}
                {emailCheckMessage}
              </div>
            )}
          </div>
          
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
          <ErrorMessage message={actionData.error} />
        )}

        {actionData && 'success' in actionData && (
          <ErrorMessage 
            message={`${actionData.success}\n${countdown > 0 ? `${countdown}초 후 로그인 페이지로 이동합니다...` : '이동 중...'}`}
            variant="success"
          />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={emailCheckStatus !== 'available'}
        >
          회원가입
        </Button>
        
        {/* 이메일 중복확인이 완료되지 않은 경우 안내 */}
        {emailCheckStatus !== 'available' && (
          <p className="text-sm text-gray-500 text-center">
            이메일 중복확인을 완료해주세요.
          </p>
        )}
      </Form>
    </AuthLayout>
  )
} 