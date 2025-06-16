import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { createInitialAgreements } from "~/lib/agreements.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') || '/auth/signup';
  const provider = url.searchParams.get('provider');
  const userAuthenticated = url.searchParams.get('user_authenticated') === 'true';
  
  return json({ next, provider, userAuthenticated });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const termsAgreed = formData.get('terms_agreed') === 'on';
  const privacyAgreed = formData.get('privacy_agreed') === 'on';
  const marketingAgreed = formData.get('marketing_agreed') === 'on';
  const next = formData.get('next') as string;
  const provider = formData.get('provider') as string;

  if (!termsAgreed || !privacyAgreed) {
    return json({ 
      error: '필수 약관에 동의해주세요.' 
    }, { status: 400 });
  }

  // 동의 정보를 세션에 저장하고 다음 단계로 이동
  const url = new URL(request.url);
  const userAuthenticated = url.searchParams.get('user_authenticated') === 'true';
  
  if (provider === 'kakao' && userAuthenticated) {
    // 이미 인증된 카카오 사용자의 경우 동의 정보 저장 후 홈으로 이동
    try {
      await createInitialAgreements(
        request,
        true, // terms_agreed
        true, // privacy_agreed  
        marketingAgreed // marketing_agreed
      )
    } catch (agreementError) {
      console.error('동의 정보 저장 실패:', agreementError)
    }
    return redirect('/');
  } else if (provider === 'kakao') {
    // 카카오 로그인의 경우 OAuth 처리 라우트로 이동
    const oauthUrl = new URL('/auth/oauth/kakao', request.url);
    oauthUrl.searchParams.set('terms_agreed', 'true');
    if (marketingAgreed) {
      oauthUrl.searchParams.set('marketing_agreed', 'true');
    }
    return redirect(oauthUrl.toString());
  } else {
    // 일반 회원가입의 경우
    const nextUrl = new URL(next, request.url);
    nextUrl.searchParams.set('terms_agreed', 'true');
    if (marketingAgreed) {
      nextUrl.searchParams.set('marketing_agreed', 'true');
    }
    return redirect(nextUrl.toString());
  }
}

export default function AuthTerms() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/auth/signup';
  const provider = searchParams.get('provider');
  
  const [allAgreed, setAllAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const handleAllAgreedChange = (checked: boolean) => {
    setAllAgreed(checked);
    setTermsAgreed(checked);
    setPrivacyAgreed(checked);
    setMarketingAgreed(checked);
  };

  const isSubmitEnabled = termsAgreed && privacyAgreed;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative">
      {/* 배경 하트 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 text-pink-300 text-8xl">♡</div>
        <div className="absolute bottom-32 left-16 text-pink-300 text-6xl">♡</div>
        <div className="absolute top-1/3 left-1/4 text-pink-300 text-4xl">♡</div>
        <div className="absolute bottom-1/4 right-1/3 text-pink-300 text-5xl">♡</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">서비스 이용 동의</h1>
          <p className="text-gray-600">
            {provider === 'kakao' ? '카카오로 회원가입하기 전' : '회원가입하기 전'} 약관에 동의해주세요
          </p>
        </div>

        <Form method="post" className="space-y-6">
          <input type="hidden" name="next" value={next} />
          {provider && <input type="hidden" name="provider" value={provider} />}
          
          {/* 전체 동의 */}
          <div className="bg-gray-50 p-4 rounded-2xl">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) => handleAllAgreedChange(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="ml-3 text-lg font-semibold text-gray-900">
                전체 동의하기
              </span>
            </label>
          </div>

          {/* 개별 약관 동의 */}
          <div className="space-y-4">
            {/* 서비스 이용약관 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  name="terms_agreed"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">
                      [필수] 서비스 이용약관 동의
                    </span>
                    <Link 
                      to="/terms" 
                      target="_blank"
                      className="text-sm text-purple-600 hover:text-purple-800 underline"
                    >
                      보기
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    코스모스 서비스 이용에 필요한 기본 약관입니다.
                  </p>
                </div>
              </label>
            </div>

            {/* 개인정보 처리방침 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  name="privacy_agreed"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">
                      [필수] 개인정보 처리방침 동의
                    </span>
                    <Link 
                      to="/privacy" 
                      target="_blank"
                      className="text-sm text-purple-600 hover:text-purple-800 underline"
                    >
                      보기
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    개인정보 수집, 이용, 보관에 대한 동의입니다.
                  </p>
                </div>
              </label>
            </div>

            {/* 마케팅 정보 수신 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  name="marketing_agreed"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                />
                <div className="ml-3 flex-1">
                  <span className="text-gray-900 font-medium">
                    [선택] 마케팅 정보 수신 동의
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    새로운 데이트 코스나 이벤트 정보를 받아보실 수 있습니다.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 에러 메시지 */}
          {actionData?.error && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-3 px-4 rounded-lg">
              {actionData.error}
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={!isSubmitEnabled}
              className={`w-full py-4 rounded-2xl font-medium transition-all duration-300 ${
                isSubmitEnabled
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              동의하고 계속하기
            </button>

            <Link
              to="/auth/login"
              className="block w-full py-4 text-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              이전으로 돌아가기
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
} 