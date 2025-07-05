import { useState } from 'react'
import { Link } from '@remix-run/react'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { createSupabaseClient } from '~/lib/supabase.client'
import { ROUTES } from '~/constants/routes'

export default function ForgotPasswordPage() {
  // 탭 상태: 'password' | 'email'
  const [tab, setTab] = useState<'password' | 'email'>('password')

  // 공통 상태들
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  const handlePasswordReset = async () => {
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다.')
    }
    setIsSubmitting(false)
  }

  const handleFindEmail = async () => {
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('nickname', nickname.trim())
      
      const response = await fetch('/api/account/find-email', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
      } else {
        setError(data.error || '이메일 조회 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="이메일 / 비밀번호 찾기" subtitle="계정 복구를 도와드릴게요">
      {/* 탭 버튼 */}
      <div className="flex mb-6 space-x-2">
        <Button
          type="button"
          className={
            tab === 'password'
              ? 'bg-purple-600 text-white rounded-xl px-4 py-2'
              : 'bg-gray-200 text-gray-700 rounded-xl px-4 py-2'
          }
          onClick={() => {
            setTab('password')
            setError(null)
            setMessage(null)
          }}
        >
          비밀번호 재설정
        </Button>
        <Button
          type="button"
          className={
            tab === 'email'
              ? 'bg-purple-600 text-white rounded-xl px-4 py-2'
              : 'bg-gray-200 text-gray-700 rounded-xl px-4 py-2'
          }
          onClick={() => {
            setTab('email')
            setError(null)
            setMessage(null)
          }}
        >
          이메일 찾기
        </Button>
      </div>

      {tab === 'password' ? (
        <div className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="가입한 이메일 주소"
            required
            className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
          />
          {error && <ErrorMessage message={error} />}
          {message && !error && (
            <p className="text-green-600 text-sm">{message}</p>
          )}
          <Button
            type="button"
            onClick={handlePasswordReset}
            disabled={isSubmitting || email.trim() === ''}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '전송 중...' : '재설정 메일 전송'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 입력"
            required
            className="px-4 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
          />
          {error && <ErrorMessage message={error} />}
          {message && !error && (
            <p className="text-green-600 text-sm">{message}</p>
          )}
          <Button
            type="button"
            onClick={handleFindEmail}
            disabled={isSubmitting || nickname.trim() === ''}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '조회 중...' : '이메일 찾기'}
          </Button>
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        <Link to={ROUTES.LOGIN} className="text-gray-600 hover:text-gray-800">
          로그인 페이지로 돌아가기
        </Link>
      </div>
    </AuthLayout>
  )
}