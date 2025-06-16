/**
 * 환경 변수 설정
 */
export const env = {
  // Supabase 설정
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  
  // 세션 설정
  SESSION_SECRET: process.env.SESSION_SECRET!,
  
  // 카카오 OAuth 설정
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID!,
  KAKAO_REDIRECT_URI: process.env.KAKAO_REDIRECT_URI!,
  
  // 개발 환경 확인
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // URL 설정
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000'
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