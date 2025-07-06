import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react'
import { useState } from 'react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout, SocialLoginSection } from '~/components/common'
import { ROUTES } from '~/constants/routes'
import { isValidEmail } from '~/utils/validation'


export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (user) {
    return redirect('/')
  }
  
  const url = new URL(request.url);
  const message = url.searchParams.get('message');
  const emailVerified = url.searchParams.get('email_verified');
  
  return json({ message, emailVerified })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return json({ error: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 })
  }

  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return json({ error: error.message }, { status: 400 })
  }

  return redirect(ROUTES.HOME, {
    headers: response.headers,
  })
}

export default function Login() {
  const actionData = useActionData<typeof action>()
  const [searchParams] = useSearchParams()
  const oauthError = searchParams.get('error')
  const message = searchParams.get('message')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 로그인 버튼 활성화 조건
  const isLoginButtonEnabled = email.trim() !== '' && password.trim() !== ''

  // 성공 메시지 처리
  const getSuccessMessage = () => {
    if (message === 'password_reset_success') {
      return '비밀번호가 성공적으로 변경되었습니다! 새로운 비밀번호로 로그인해주세요.'
    }
    if (message === 'email_verified') {
      return '이메일 인증이 완료되었습니다! 로그인하여 서비스를 이용해보세요.'
    }
    return null
  }

  // 오류 메시지 처리
  const getErrorMessage = () => {
    if (actionData?.error) return actionData.error
    if (oauthError === 'session_expired') return '세션이 만료되었습니다. 다시 로그인해주세요.'
    if (oauthError === 'callback_error') return '로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
    if (oauthError === 'access_denied') return '이메일 인증 링크가 만료되거나 잘못되었습니다.'
    if (oauthError) return `OAuth 로그인 오류: ${oauthError}`
    return null
  }

  const successMessage = getSuccessMessage()
  const errorMessage = getErrorMessage()

  return (
    <AuthLayout 
      title="로그인"
      subtitle="코스모스에 오신 것을 환영합니다"
      showSocialLogin={true}
      socialLoginComponent={<SocialLoginSection mode="login" />}
    >
      <Form method="post" className="space-y-4">
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 아이디"
          required
          className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
        />
        
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
        />

        {/* 성공 메시지 */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-green-500 text-lg">✅</span>
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {errorMessage && <ErrorMessage message={errorMessage} />}

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          disabled={!isLoginButtonEnabled}
          className={`w-full py-4 rounded-2xl font-medium transition-all duration-300 ${
            isLoginButtonEnabled
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-gray-500 border border-gray-600 text-gray-300 cursor-not-allowed shadow-sm'
          }`}
        >
          로그인
        </Button>
      </Form>

      {/* 이메일/비밀번호 찾기 및 회원가입 링크 */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-gray-600 hover:text-gray-800">
          이메일 / 비밀번호 찾기
        </Link>
        <Link to={ROUTES.SIGNUP} className="text-gray-600 hover:text-gray-800">
          회원가입
        </Link>
      </div>
    </AuthLayout>
  )
} 