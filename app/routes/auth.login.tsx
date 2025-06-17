import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react'
import { useState } from 'react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { Button, Input } from '~/components/ui'
import { ROUTES } from '~/constants/routes'
import { isValidEmail } from '~/utils/validation'
import { useSocialLogin } from '~/hooks/useSocialLogin'
import SocialLoginButton from '~/components/common/SocialLoginButton'


export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (user) {
    return redirect('/')
  }
  return json({})
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // 소셜 로그인 공통 훅 사용
  const { handleSocialLogin, isLoading: isSocialLoading } = useSocialLogin({
    flow: 'login'
  })

  // 로그인 버튼 활성화 조건
  const isLoginButtonEnabled = email.trim() !== '' && password.trim() !== ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex flex-col items-center justify-center px-4 relative">
      <div className="w-full max-w-md relative z-10">
        {/* 로고 및 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">로그인</h1>
          <p className="text-white/90">코스모스에 오신 것을 환영합니다</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
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

          {/* 에러 메시지 */}
          {actionData?.error && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
              {actionData.error}
            </div>
          )}

          {oauthError && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
              {oauthError === 'session_expired' 
                ? '세션이 만료되었습니다. 다시 로그인해주세요.'
                : oauthError === 'callback_error'
                ? '로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
                : `OAuth 로그인 오류: ${oauthError}`
              }
            </div>
          )}

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
            <Link to="/auth/forgot-password" className="text-gray-600 hover:text-gray-800">
              이메일 / 비밀번호 찾기
            </Link>
            <Link to={ROUTES.SIGNUP} className="text-gray-600 hover:text-gray-800">
              회원가입
            </Link>
          </div>
        </div>

        {/* 소셜 로그인 */}
        <div className="mt-8 space-y-3">
          {/* Apple 로그인 - 비활성화 */}
          <SocialLoginButton
            provider="apple"
            isLoading={false}
            onClick={() => {}}
            disabled={true}
            mode="login"
            className="opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
          />

          {/* 구글 로그인 */}
          <SocialLoginButton
            provider="google"
            isLoading={isSocialLoading('google')}
            onClick={() => handleSocialLogin('google')}
            mode="login"
          />

          {/* 카카오 로그인 */}
          <SocialLoginButton
            provider="kakao"
            isLoading={isSocialLoading('kakao')}
            onClick={() => handleSocialLogin('kakao')}
            mode="login"
          />
        </div>
      </div>
    </div>
  )
} 