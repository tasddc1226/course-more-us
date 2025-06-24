/**
 * 환경 변수 설정
 */

// 서버/클라이언트 환경 구분
const isServer = typeof window === 'undefined'

export const env = {
  // Supabase 설정 (서버에서만 사용)
  SUPABASE_URL: isServer ? process.env.SUPABASE_URL! : '',
  SUPABASE_ANON_KEY: isServer ? process.env.SUPABASE_ANON_KEY! : '',
  SUPABASE_SERVICE_ROLE_KEY: isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY! : '',
  
  // 세션 설정 (서버에서만 사용)
  SESSION_SECRET: isServer ? process.env.SESSION_SECRET! : '',
  
  // 카카오 OAuth 설정 (서버에서만 사용)
  KAKAO_CLIENT_ID: isServer ? process.env.KAKAO_CLIENT_ID! : '',
  KAKAO_REDIRECT_URI: isServer ? process.env.KAKAO_REDIRECT_URI! : '',
  
  // 카카오 지도 API 설정 (클라이언트에서 사용)
  KAKAO_MAP_APP_KEY: isServer 
    ? process.env.VITE_KAKAO_MAP_APP_KEY! 
    : import.meta.env.VITE_KAKAO_MAP_APP_KEY!,
  
  // 구글 OAuth 설정 (선택사항 - Supabase에서 직접 관리)
  GOOGLE_CLIENT_ID: isServer ? process.env.GOOGLE_CLIENT_ID : '',
  
  // 개발 환경 확인
  NODE_ENV: isServer ? (process.env.NODE_ENV || 'development') : 'development',
  
  // URL 설정
  BASE_URL: isServer ? (process.env.BASE_URL || 'http://localhost:3000') : 'http://localhost:3000'
} as const;

/**
 * 필수 환경 변수 검증
 */
export function validateEnv() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SESSION_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * 개발 환경 여부 확인
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 프로덕션 환경 여부 확인
 */
export const isProduction = env.NODE_ENV === 'production'; 