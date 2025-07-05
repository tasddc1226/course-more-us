import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { ROUTES } from '~/constants/routes'

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  // URL에서 세션 정보 확인
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    // 세션이 없으면 로그인 페이지로 리다이렉트
    return redirect(`${ROUTES.LOGIN}?error=session_expired`)
  }
  
  return json({ hasValidSession: true }, {
    headers: response.headers
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
  
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return json({ error: error.message }, { status: 400 })
  }

  // 성공 시 로그인 페이지로 리다이렉트
  return redirect(`${ROUTES.LOGIN}?message=password_reset_success`, {
    headers: response.headers
  })
}

export default function ResetPasswordPage() {
  const actionData = useActionData<typeof action>()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 성공 메시지 카운트다운 (실제로는 리다이렉트되지만 혹시를 위해)
  useEffect(() => {
    if (actionData && 'success' in actionData) {
      setCountdown(3)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [actionData])

  // 입력 필드 유효성 검사
  const isFormValid = newPassword.trim() !== '' && confirmPassword.trim() !== ''

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