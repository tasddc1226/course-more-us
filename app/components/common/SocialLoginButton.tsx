import { SocialProvider } from '~/hooks/useSocialLogin';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

// 소셜 제공자별 설정
const socialProviderConfig = {
  google: {
    name: '구글',
    loadingText: '구글 로그인 중...',
    actionText: '구글로 로그인',
    signupText: '구글로 시작하기',
    className: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  kakao: {
    name: '카카오',
    loadingText: '카카오 로그인 중...',
    actionText: '카카오로 로그인',
    signupText: '카카오로 시작하기',
    className: 'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
      </svg>
    ),
  },
  apple: {
    name: 'Apple',
    loadingText: 'Apple 로그인 중...',
    actionText: 'Apple로 로그인',
    signupText: 'Apple로 시작하기',
    className: 'bg-black text-white hover:bg-gray-900',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  facebook: {
    name: '페이스북',
    loadingText: '페이스북 로그인 중...',
    actionText: '페이스북으로 로그인',
    signupText: '페이스북으로 시작하기',
    className: 'bg-blue-600 text-white hover:bg-blue-700',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
} as const;

export default function SocialLoginButton({ 
  provider, 
  isLoading, 
  onClick, 
  disabled, 
  className = '',
  ...props 
}: SocialLoginButtonProps & { mode?: 'login' | 'signup' }) {
  const config = socialProviderConfig[provider];
  const mode = props.mode || 'login';
  
  const buttonText = isLoading 
    ? config.loadingText 
    : mode === 'signup' 
      ? config.signupText 
      : config.actionText;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        w-full py-4 rounded-2xl font-medium 
        flex items-center justify-center space-x-3 
        transition-colors disabled:opacity-50 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        shadow-sm
        ${config.className}
        ${className}
      `}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {config.icon}
      </div>
      <span>{buttonText}</span>
    </button>
  );
} 