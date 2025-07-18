export const ROUTES = {
  // 메인 페이지
  HOME: '/',
  
  // 인증 관련
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  CALLBACK: '/auth/callback',
  TERMS: '/auth/terms',
  RESET_PASSWORD: '/auth/reset-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_EMAIL: '/auth/verify-email',
  EMAIL_CONFIRM: '/auth/email-confirm',
  
  // 약관 및 정책
  SERVICE_TERMS: '/terms',
  PRIVACY_POLICY: '/privacy',
  
  // 관리자
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PLACES: '/admin/places',
  ADMIN_PLACES_NEW: '/admin/places/new',
  
  // 추천 시스템 (향후 추가)
  RECOMMENDATIONS: '/recommendations',
  MY_FAVORITES: '/my-favorites',
  PROFILE: '/profile',
  MY_PROFILE: '/my-profile',
  MY_INFO: '/my-info',
  
  // User Place Routes
  REGISTER_PLACE: '/register-place',
  MY_PLACES: '/my-places',
} as const;

export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_PLACES,
  ROUTES.ADMIN_PLACES_NEW
] as const;

export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.LOGOUT,
  ROUTES.CALLBACK,
  ROUTES.TERMS,
  ROUTES.RESET_PASSWORD,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.EMAIL_CONFIRM
] as const;

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.SERVICE_TERMS,
  ROUTES.PRIVACY_POLICY,
  ...AUTH_ROUTES
] as const; 