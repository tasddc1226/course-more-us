import { useState, useEffect } from 'react'
import { Link, useSearchParams } from '@remix-run/react'
import { Button, Input } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { createSupabaseClient } from '~/lib/supabase.client'
import { ROUTES } from '~/constants/routes'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualEmail, setManualEmail] = useState('')

  const email = searchParams.get('email') || ''
  const errorType = searchParams.get('error')
  const supabase = createSupabaseClient()

  // URL에서 에러 파라미터가 있는 경우 초기 에러 메시지 설정
  useEffect(() => {
    if (errorType === 'expired') {
      setError('이메일 인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.')
      setCanResend(true) // 즉시 재전송 가능하도록 설정
    }
  }, [errorType])

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleResendEmail = async (emailToUse?: string) => {
    const targetEmail = emailToUse || email
    
    if (!targetEmail) {
      setError('이메일 정보를 찾을 수 없습니다.')
      return
    }

    setIsResending(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage(`${targetEmail}로 인증 이메일이 다시 전송되었습니다.`)
        setCountdown(60)
        setCanResend(false)
      }
    } catch (err) {
      setError('이메일 재전송 중 오류가 발생했습니다.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="이메일 인증"
      subtitle="회원가입을 완료하기 위해 이메일을 확인해주세요"
    >
      <div className="text-center space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            이메일 인증이 필요합니다
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            회원가입을 완료하기 위해 다음 이메일로 전송된 인증 링크를 클릭해주세요:
          </p>
          {email ? (
            <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded border">
              {email}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                이메일 주소를 입력해주세요:
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="flex-1"
                />
                <Button
                  onClick={() => handleResendEmail(manualEmail)}
                  disabled={!manualEmail || isResending}
                  variant="primary"
                  className="whitespace-nowrap"
                >
                  {isResending ? '전송 중...' : '인증 이메일 전송'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>• 이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요</p>
            <p>• 인증 링크는 24시간 동안 유효합니다</p>
            <p>• 인증 완료 후 자동으로 로그인됩니다</p>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => handleResendEmail(email || manualEmail)}
              disabled={!canResend || isResending || (!email && !manualEmail)}
              variant="outline"
              className="w-full"
            >
              {isResending ? '전송 중...' : canResend ? '인증 이메일 재전송' : `재전송 (${countdown}초 후)`}
            </Button>

            {email && (
              <Button
                onClick={() => setShowManualInput(!showManualInput)}
                variant="outline"
                className="w-full text-sm"
              >
                다른 이메일로 재전송하기
              </Button>
            )}

            {(showManualInput && email) && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  다른 이메일 주소로 인증 링크를 받고 싶다면:
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="다른 이메일 주소"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleResendEmail(manualEmail)}
                    disabled={!manualEmail || isResending}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    전송
                  </Button>
                </div>
              </div>
            )}

            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
} 