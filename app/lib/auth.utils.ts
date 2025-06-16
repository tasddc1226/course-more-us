// 브라우저에서 인증 관련 쿠키를 클리어하는 함수
export function clearAuthCookies() {
  if (typeof window === 'undefined') return

  // Supabase 관련 쿠키들을 클리어
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'sb-auth-token',
    'supabase-auth-token'
  ]

  cookiesToClear.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })

  // localStorage도 클리어
  try {
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('sb-access-token')
    localStorage.removeItem('sb-refresh-token')
  } catch (error) {
    console.warn('LocalStorage 클리어 실패:', error)
  }

  // sessionStorage도 클리어
  try {
    sessionStorage.clear()
  } catch (error) {
    console.warn('SessionStorage 클리어 실패:', error)
  }
}

// 세션 만료 시 클리어 및 리다이렉트
export function handleSessionExpired() {
  clearAuthCookies()
  window.location.href = '/auth/login?error=session_expired'
} 