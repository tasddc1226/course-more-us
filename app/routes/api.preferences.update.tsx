import { json, type ActionFunction } from "@remix-run/node";
import { requireUser } from "~/lib/auth.server";
import { updateUserPreferences } from "~/lib/preferences.server";
import { createClient } from "~/lib/supabase.server";
import type { UpdatePreferencesRequest } from "~/types/preferences";

export const action: ActionFunction = async ({ request }) => {
  // PUT 메소드만 허용
  if (request.method !== "PUT") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 인증 확인
    const user = await requireUser(request);
    
    // 요청 본문 파싱
    const body = await request.json() as UpdatePreferencesRequest;
    
    // 유효성 검증
    if (body.priceRangeMin !== undefined && body.priceRangeMin < 0) {
      return json({ error: "최소 가격은 0원 이상이어야 합니다." }, { status: 400 });
    }
    
    if (body.priceRangeMax !== undefined && body.priceRangeMax < (body.priceRangeMin || 0)) {
      return json({ error: "최대 가격은 최소 가격보다 커야 합니다." }, { status: 400 });
    }
    
    if (body.groupSizePreference !== undefined && (body.groupSizePreference < 1 || body.groupSizePreference > 20)) {
      return json({ error: "그룹 크기는 1-20명 사이여야 합니다." }, { status: 400 });
    }
    
    // Supabase 클라이언트 생성
    const supabase = createClient(request);
    
    // 선호도 업데이트
    const preferences = await updateUserPreferences(supabase, user.id, body);
    
    if (!preferences) {
      return json({ error: "선호도 업데이트에 실패했습니다." }, { status: 500 });
    }
    
    return json({ success: true, preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};