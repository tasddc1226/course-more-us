import { useState } from 'react'
import { Link } from '@remix-run/react'
import { Input } from '~/components/ui'
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
    <AuthLayout title="계정 복구" subtitle="잊어버린 정보를 쉽게 찾아드릴게요">
      {/* 안내 메시지 */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <p className="text-gray-600 text-sm leading-relaxed">
          {tab === 'password' 
            ? '등록하신 이메일로 비밀번호 재설정 링크를 보내드립니다'
            : '닉네임을 입력하시면 가입하신 이메일을 찾아드립니다'
          }
        </p>
      </div>

      {/* 개선된 탭 버튼 */}
      <div className="flex mb-8 bg-gray-100 rounded-2xl p-2">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
            tab === 'password'
              ? 'bg-white text-purple-600 shadow-md transform scale-[1.02]'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setTab('password')
            setError(null)
            setMessage(null)
          }}
        >
          <span className="text-lg">🔑</span>
          <span className="text-sm">비밀번호 재설정</span>
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
            tab === 'email'
              ? 'bg-white text-purple-600 shadow-md transform scale-[1.02]'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setTab('email')
            setError(null)
            setMessage(null)
          }}
        >
          <span className="text-lg">📧</span>
          <span className="text-sm">이메일 찾기</span>
        </button>
      </div>

      {/* 메인 컨텐츠 카드 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
        {tab === 'password' ? (
          <div className="space-y-6">
            {/* 단계 안내 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                이메일 입력
              </span>
              <span className="flex-1 h-px bg-gray-200 mx-3"></span>
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                이메일 확인
              </span>
              <span className="flex-1 h-px bg-gray-200 mx-3"></span>
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                비밀번호 재설정
              </span>
            </div>

            {/* 입력 필드 */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
                />
              </div>

              {/* 상태 메시지 */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-red-500 text-lg">❌</span>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {message && !error && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-green-500 text-lg">✅</span>
                  <p className="text-green-600 text-sm">{message}</p>
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isSubmitting || email.trim() === ''}
                className={`w-full py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubmitting || email.trim() === ''
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>전송 중...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">📨</span>
                    <span>재설정 메일 전송</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 단계 안내 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                닉네임 입력
              </span>
              <span className="flex-1 h-px bg-gray-200 mx-3"></span>
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                이메일 조회
              </span>
            </div>

            {/* 입력 필드 */}
            <div className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  닉네임
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="가입 시 사용한 닉네임을 입력하세요"
                  required
                  className="px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all"
                />
              </div>

              {/* 상태 메시지 */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-red-500 text-lg">❌</span>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {message && !error && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-green-500 text-lg">✅</span>
                  <p className="text-green-600 text-sm">{message}</p>
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="button"
                onClick={handleFindEmail}
                disabled={isSubmitting || nickname.trim() === ''}
                className={`w-full py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubmitting || nickname.trim() === ''
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>조회 중...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🔍</span>
                    <span>이메일 찾기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 안내 및 링크 */}
      <div className="space-y-4 text-center">
        {/* 도움말 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-blue-500 text-lg">💡</span>
            <p className="text-blue-700 font-medium text-sm">도움말</p>
          </div>
          <p className="text-blue-600 text-xs leading-relaxed">
            {tab === 'password' 
              ? '이메일이 오지 않으면 스팸함을 확인해주세요. 링크는 1시간 후 만료됩니다.'
              : '닉네임이 정확하지 않으면 이메일을 찾을 수 없습니다. 대소문자를 구분하여 입력해주세요.'
            }
          </p>
        </div>

        {/* 뒤로가기 링크 */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link 
            to={ROUTES.LOGIN} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            로그인 페이지로 돌아가기
          </Link>
          <span className="text-gray-300">|</span>
          <Link 
            to={ROUTES.SIGNUP} 
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>👤</span>
            새 계정 만들기
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}