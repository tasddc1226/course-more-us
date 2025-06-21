import { useState } from 'react';
import { createSupabaseClient } from '~/lib/supabase.client';

export type SocialProvider = 'google' | 'kakao' | 'apple' | 'facebook';

interface UseSocialLoginOptions {
  flow?: 'login' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useSocialLogin(options: UseSocialLoginOptions = {}) {
  const { flow = 'login', onSuccess, onError } = options;
  const [loadingStates, setLoadingStates] = useState<Record<SocialProvider, boolean>>({
    google: false,
    kakao: false,
    apple: false,
    facebook: false,
  });

  const handleSocialLogin = async (provider: SocialProvider) => {
    // 이미 로딩 중이면 중복 클릭 방지
    if (loadingStates[provider]) return;

    setLoadingStates(prev => ({ ...prev, [provider]: true }));
    
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=${flow}`,
        },
      });
      
      if (error) {
        const providerNames = {
          google: '구글',
          kakao: '카카오',
          apple: 'Apple',
          facebook: '페이스북'
        };
        
        const errorMessage = `${providerNames[provider]} 로그인 중 오류가 발생했습니다: ${error.message}`;
        console.error(`${provider} 로그인 오류:`, error);
        
        if (onError) {
          onError(errorMessage);
        } else {
          alert(errorMessage);
        }
        
        setLoadingStates(prev => ({ ...prev, [provider]: false }));
        return;
      }
      
      // OAuth 리다이렉트가 성공적으로 시작되면 로딩 상태는 유지
      onSuccess?.();
      
    } catch (error) {
      const providerNames = {
        google: '구글',
        kakao: '카카오',
        apple: 'Apple',
        facebook: '페이스북'
      };
      
      const errorMessage = `${providerNames[provider]} 로그인 중 예외가 발생했습니다.`;
      console.error(`${provider} 로그인 예외:`, error);
      
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      
      setLoadingStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  return {
    loadingStates,
    handleSocialLogin,
    isLoading: (provider: SocialProvider) => loadingStates[provider],
  };
} 