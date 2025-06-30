import { useEffect, useState } from 'react'
import { useNavigate } from '@remix-run/react'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { createSupabaseClient } from '~/lib/supabase.client'
import { ROUTES } from '~/constants/routes'

export default function ResetPasswordPage() {
  const supabase = createSupabaseClient()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 링크 유효성 검사: 세션이 있어야 함
  useEffect(() => {
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('링크가 만료되었거나 유효하지 않습니다.')
      }
    }
    verifySession()
  }, [])

  const handleUpdatePassword = async () => {
    setError(null)
    setMessage(null)

    if (newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
    } else {
      setMessage('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.')
      // 2초 후 로그인 페이지로 이동
      setTimeout(() => navigate(ROUTES.LOGIN), 2000)
    }
    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="비밀번호 재설정" subtitle="새로운 비밀번호를 입력해주세요">
      <div className="space-y-4">
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호"
          required
          className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
        />
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호 확인"
          required
          className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
        />

        {error && <ErrorMessage message={error} />}
        {message && !error && (
          <p className="text-green-600 text-sm">{message}</p>
        )}

        <Button
          type="button"
          onClick={handleUpdatePassword}
          disabled={isSubmitting || newPassword.trim() === '' || confirmPassword.trim() === ''}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </div>
    </AuthLayout>
  )
}