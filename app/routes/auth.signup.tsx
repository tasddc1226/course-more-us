import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link } from '@remix-run/react'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { getUser } from '~/lib/auth.server'
import { createSupabaseClient } from '~/lib/supabase.client'
import { useState } from 'react'

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
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !confirmPassword) {
    return json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  if (password.length < 6) {
    return json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient(request)
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return json({ error: error.message }, { status: 400 })
  }

  return json({ success: '회원가입이 완료되었습니다. 이메일을 확인해주세요.' })
}

export default function Signup() {
  const actionData = useActionData<typeof action>()
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)

  const handleKakaoLogin = async () => {
    if (isKakaoLoading) return // 중복 클릭 방지
    
    setIsKakaoLoading(true)
    try {
      // 브라우저 스토리지 정리
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      
      const supabase = createSupabaseClient()
      
      // 기존 세션 완전히 정리
      await supabase.auth.signOut({ scope: 'global' })
      
      // 잠시 대기 후 OAuth 시작
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/')}`,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            코스모스 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{' '}
            <Link
              to="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              기존 계정으로 로그인
            </Link>
          </p>
        </div>
        <Form className="mt-8 space-y-6" method="post">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                이메일
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
              />
            </div>
          </div>

          {actionData && 'error' in actionData && (
            <div className="text-red-600 text-sm text-center">
              {actionData.error}
            </div>
          )}

          {actionData && 'success' in actionData && (
            <div className="text-green-600 text-sm text-center">
              {actionData.success}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              회원가입
            </button>
          </div>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={isKakaoLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-yellow-400 text-sm font-medium text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50"
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
  )
} 