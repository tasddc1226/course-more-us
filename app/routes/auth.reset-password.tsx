import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link, useNavigate } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { ROUTES } from '~/constants/routes'

export async function loader() {
  // 비밀번호 재설정 페이지는 특별한 경우로 세션 체크 없이 표시
  // 실제 인증은 action에서 updateUser() 시 Supabase가 자동으로 검증
  return json({ 
    message: '비밀번호 재설정 페이지입니다.' 
  })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (!newPassword || !confirmPassword) {
    return json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
  }

  if (newPassword !== confirmPassword) {
    return json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  // 비밀번호 재설정 플로우에서는 updateUser() 호출 시 Supabase가 자동 검증
  // 먼저 getUser() 호출 없이 바로 updateUser() 시도
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    // 구체적인 에러 메시지 처리
    if (error.message.includes('session_not_found') || error.message.includes('Auth session missing')) {
      return json({ 
        error: '인증이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.' 
      }, { status: 401 })
    }
    if (error.message.includes('Invalid login credentials')) {
      return json({ 
        error: '비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.' 
      }, { status: 401 })
    }
    return json({ error: error.message }, { status: 400 })
  }

  // 성공 시 클라이언트에게 성공 상태 반환
  return json({ success: true }, {
    headers: response.headers
  })
}

export default function ResetPasswordPage() {
  const actionData = useActionData<typeof action>()
  const navigate = useNavigate()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [urlError, setUrlError] = useState<string | null>(null)

  // URL 해시에서 Supabase 에러 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const error = params.get('error')
        const errorCode = params.get('error_code')
        const errorDescription = params.get('error_description')
        
        if (error) {
          if (errorCode === 'otp_expired') {
            setUrlError('비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.')
          } else {
            setUrlError(errorDescription || `인증 오류: ${error}`)
          }
        }
      }
    }
  }, [])

  // 성공 메시지 카운트다운 및 리다이렉트
  useEffect(() => {
    if (actionData && 'success' in actionData) {
      setCountdown(3)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            // 카운트다운 완료 시 로그인 페이지로 리다이렉트
            navigate(`${ROUTES.LOGIN}?message=password_reset_success`)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [actionData, navigate])

  // 입력 필드 유효성 검사
  const isFormValid = newPassword.trim() !== '' && confirmPassword.trim() !== '' && !urlError

  return (
    <AuthLayout title="비밀번호 재설정" subtitle="새로운 비밀번호를 입력해주세요">
      <Form method="post" className="space-y-4">
        <Input
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호 (8자 이상)"
          required
          className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
        />
        <Input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호 확인"
          required
          className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
        />

        {/* 에러 메시지 */}
        {urlError && (
          <div className="space-y-3">
            <ErrorMessage message={urlError} />
            <div className="text-center">
              <Link 
                to={ROUTES.FORGOT_PASSWORD} 
                className="text-purple-600 hover:text-purple-800 text-sm underline"
              >
                새로운 비밀번호 재설정 링크 요청하기
              </Link>
            </div>
          </div>
        )}
        {actionData?.error && <ErrorMessage message={actionData.error} />}

        {/* 성공 메시지 */}
        {actionData && 'success' in actionData && (
          <div className="text-green-600 text-sm text-center">
            비밀번호가 성공적으로 변경되었습니다! 로그인 페이지로 이동합니다...
            {countdown > 0 && ` (${countdown}초)`}
          </div>
        )}

        <Button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-4 rounded-2xl font-medium transition-all duration-300 ${
            isFormValid
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-gray-400 text-gray-300 cursor-not-allowed'
          }`}
        >
          비밀번호 변경
        </Button>
      </Form>
    </AuthLayout>
  )
}