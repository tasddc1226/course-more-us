import { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  showSocialLogin?: boolean;
  socialLoginComponent?: ReactNode;
}

export default function AuthLayout({ 
  title, 
  subtitle, 
  children, 
  showSocialLogin = false, 
  socialLoginComponent 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex flex-col items-center justify-center px-4 relative">
      <div className="w-full max-w-md relative z-10">
        {/* 로고 및 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-white/90">{subtitle}</p>
        </div>

        {/* 메인 폼 컨테이너 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          {children}
        </div>

        {/* 소셜 로그인 */}
        {showSocialLogin && socialLoginComponent && (
          <div className="mt-8">
            {socialLoginComponent}
          </div>
        )}
      </div>
    </div>
  );
} 