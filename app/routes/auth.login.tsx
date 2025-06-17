import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react'
import { useState } from 'react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { createSupabaseClient } from '~/lib/supabase.client'
import { Button, Input } from '~/components/ui'
import { ROUTES } from '~/constants/routes'
import { isValidEmail } from '~/utils/validation'


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
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 로그인 버튼 활성화 조건
  const isLoginButtonEnabled = email.trim() !== '' && password.trim() !== ''

  const handleKakaoLogin = async () => {
    if (isKakaoLoading) return // 중복 클릭 방지
    
    setIsKakaoLoading(true)
    try {
      // 클라이언트에서 직접 카카오 OAuth 처리
      const supabase = createSupabaseClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=login`,
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
          <button 
            disabled
            className="w-full bg-gray-300 text-gray-500 py-4 rounded-2xl font-medium flex items-center justify-center space-x-3 cursor-not-allowed opacity-50"
          >
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <span>Apple로 로그인 (준비중)</span>
          </button>

          {/* 네이버 로그인 - 비활성화 */}
          <button 
            disabled
            className="w-full bg-gray-300 text-gray-500 py-4 rounded-2xl font-medium flex items-center justify-center space-x-3 cursor-not-allowed opacity-50"
          >
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span>네이버로 로그인 (준비중)</span>
          </button>

          {/* 카카오 로그인 - 활성화 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isKakaoLoading}
            className="w-full bg-yellow-400 text-gray-900 py-4 rounded-2xl font-medium flex items-center justify-center space-x-3 hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
              </svg>
            </div>
            <span>{isKakaoLoading ? '카카오 로그인 중...' : '카카오로 로그인'}</span>
          </button>
        </div>
      </div>
    </div>
  )
} 