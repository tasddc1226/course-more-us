import { useSocialLogin } from '~/hooks/useSocialLogin';
import SocialLoginButton from './SocialLoginButton';

interface SocialLoginSectionProps {
  mode: 'login' | 'signup';
}

export default function SocialLoginSection({ mode }: SocialLoginSectionProps) {
  const { handleSocialLogin, isLoading: isSocialLoading } = useSocialLogin({
    flow: mode
  });

  return (
    <div className="space-y-3">
      {/* Apple 로그인 - 비활성화 */}
      <SocialLoginButton
        provider="apple"
        isLoading={false}
        onClick={() => {}}
        disabled={true}
        mode={mode}
        className="opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
      />

      {/* 구글 로그인 */}
      <SocialLoginButton
        provider="google"
        isLoading={isSocialLoading('google')}
        onClick={() => handleSocialLogin('google')}
        mode={mode}
      />

      {/* 카카오 로그인 */}
      <SocialLoginButton
        provider="kakao"
        isLoading={isSocialLoading('kakao')}
        onClick={() => handleSocialLogin('kakao')}
        mode={mode}
      />
    </div>
  );
} 