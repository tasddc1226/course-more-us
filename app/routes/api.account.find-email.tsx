import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { supabaseAdmin } from "~/lib/supabase.server";

/**
 * 이메일 주소를 마스킹하는 함수
 * 예: example@domain.com → e***e@domain.com
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedLength = Math.min(localPart.length - 2, 3); // 최대 3개의 별표
  
  return `${firstChar}${'*'.repeat(maskedLength)}${lastChar}@${domain}`;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const nickname = formData.get('nickname') as string;

    if (!nickname?.trim()) {
      return json({ 
        success: false, 
        error: '닉네임을 입력해주세요.' 
      }, { status: 400 });
    }

    // 닉네임으로 사용자 프로필 검색
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('nickname', nickname.trim())
      .single();

    if (profileError || !profile) {
      return json({ 
        success: false, 
        error: '해당 닉네임으로 가입된 계정을 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 사용자 이메일 조회
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userError || !user.user?.email) {
      return json({ 
        success: false, 
        error: '사용자 정보를 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 이메일 마스킹
    const maskedEmail = maskEmail(user.user.email);

    return json({ 
      success: true, 
      message: `가입된 이메일 주소: ${maskedEmail}`,
      maskedEmail 
    });

  } catch (error) {
    console.error('Find email error:', error);
    return json({ 
      success: false, 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    }, { status: 500 });
  }
} 