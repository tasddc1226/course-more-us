import { json, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, Link, useNavigate } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { Button, Input, ErrorMessage } from '~/components/ui'
import { AuthLayout } from '~/components/common'
import { createSupabaseServerClient } from '~/lib/supabase.server'
import { createSupabaseClient } from '~/lib/supabase.client'
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
  const accessToken = formData.get('accessToken') as string
  const refreshToken = formData.get('refreshToken') as string
  
  if (!newPassword || !confirmPassword) {
    return json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
  }

  if (newPassword !== confirmPassword) {
    return json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  if (!accessToken || !refreshToken) {
    return json({ error: '인증 토큰이 없습니다. 비밀번호 재설정을 다시 요청해주세요.' }, { status: 401 })
  }

  const response = new Response()
  const supabase = createSupabaseServerClient(request, response)
  
  // 토큰을 사용해서 세션 설정
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  if (sessionError) {
    console.error('세션 설정 에러:', sessionError)
    if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
      return json({ 
        error: '비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.' 
      }, { status: 401 })
    }
    return json({ error: sessionError.message }, { status: 400 })
  }

  // 비밀번호 업데이트
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    console.error('비밀번호 업데이트 에러:', error)
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
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  // URL 해시에서 토큰 및 에러 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const searchParams = url.searchParams
      const hash = window.location.hash
      
      console.log('현재 URL 상태:', {
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        searchParams: Object.fromEntries(searchParams.entries())
      })
      
      // Query parameter에서 token_hash와 type 확인 (이메일 템플릿에서 직접 전달)
      const tokenHashFromQuery = searchParams.get('token_hash')
      const typeFromQuery = searchParams.get('type')
      
      // Query parameter와 hash에서 에러 확인
      let error = searchParams.get('error')
      let errorCode = searchParams.get('error_code')
      let errorDescription = searchParams.get('error_description')
      
      // Hash에서도 에러 확인 (fallback)
      if (!error && hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        error = hashParams.get('error')
        errorCode = hashParams.get('error_code')
        errorDescription = hashParams.get('error_description')
        
        console.log('Hash 파라미터:', Object.fromEntries(hashParams.entries()))
      }
      
      if (error) {
        console.log('인증 에러 발생:', { error, errorCode, errorDescription })
        
        if (errorCode === 'otp_expired' || error === 'access_denied') {
          setUrlError('비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.')
        } else {
          setUrlError(errorDescription || `인증 오류: ${error}`)
        }
        return
      }
      
      // token_hash가 query parameter에 있는 경우 (새로운 이메일 템플릿 방식)
      if (tokenHashFromQuery && typeFromQuery === 'recovery') {
        console.log('Query parameter에서 token_hash 발견:', tokenHashFromQuery)
        
                 // verifyOtp를 사용하여 세션 생성
         const verifyTokenAndSetSession = async () => {
           try {
             const supabase = createSupabaseClient()
             const { data, error: verifyError } = await supabase.auth.verifyOtp({
               token_hash: tokenHashFromQuery,
               type: 'recovery'
             })
            
            if (verifyError) {
              console.error('토큰 검증 실패:', verifyError)
              setUrlError('비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.')
              return
            }
            
            if (data.session) {
              console.log('세션 생성 성공')
              setAccessToken(data.session.access_token)
              setRefreshToken(data.session.refresh_token)
              
              // URL에서 토큰 제거
              window.history.replaceState({}, document.title, window.location.pathname)
            }
          } catch (err) {
            console.error('토큰 검증 중 오류:', err)
            setUrlError('비밀번호 재설정 처리 중 오류가 발생했습니다.')
          }
        }
        
        verifyTokenAndSetSession()
        return
      }
      
      // 기존 방식: 토큰 확인 (hash에서만 가능)
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        
        console.log('토큰 확인 결과:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          accessTokenLength: access_token?.length || 0,
          refreshTokenLength: refresh_token?.length || 0
        })
        
        if (access_token && refresh_token) {
          // 토큰이 있으면 저장
          setAccessToken(access_token)
          setRefreshToken(refresh_token)
          
          console.log('토큰 저장 완료')
          
          // URL 해시와 query parameter 제거 (보안상 토큰이 URL에 남지 않도록)
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          console.log('토큰이 없음 - 에러 표시')
          setUrlError('비밀번호 재설정 링크가 유효하지 않습니다. 새로운 링크를 요청해주세요.')
        }
      } else {
        console.log('해시가 없음 - 에러 표시')
        
        // token_hash도 없고 직접 페이지에 접근한 경우
        if (!tokenHashFromQuery && window.location.search === '' && window.location.hash === '') {
          setUrlError('이메일의 비밀번호 재설정 링크를 클릭해주세요.')
        } else if (!tokenHashFromQuery) {
          setUrlError('비밀번호 재설정 링크가 유효하지 않습니다. 새로운 링크를 요청해주세요.')
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
            // 세션을 로그아웃시키고 로그인 페이지로 리다이렉트
            const handleLogoutAndRedirect = async () => {
              try {
                const supabase = createSupabaseClient()
                await supabase.auth.signOut()
                console.log('비밀번호 변경 후 자동 로그아웃 완료')
              } catch (error) {
                console.error('로그아웃 중 오류:', error)
              } finally {
                // 로그아웃 완료 후 로그인 페이지로 이동
                navigate(`${ROUTES.LOGIN}?message=password_reset_success`)
              }
            }
            handleLogoutAndRedirect()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [actionData, navigate])

  // 입력 필드 유효성 검사
  const isFormValid = newPassword.trim() !== '' && confirmPassword.trim() !== '' && !urlError && accessToken && refreshToken

  return (
    <AuthLayout title="비밀번호 재설정" subtitle="새로운 비밀번호를 입력해주세요">
      <Form method="post" className="space-y-4">
        {/* 토큰을 hidden input으로 전송 */}
        <input type="hidden" name="accessToken" value={accessToken || ''} />
        <input type="hidden" name="refreshToken" value={refreshToken || ''} />
        
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
        {actionData && 'error' in actionData && <ErrorMessage message={actionData.error} />}

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