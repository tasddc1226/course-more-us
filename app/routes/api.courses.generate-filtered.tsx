import { json, type ActionFunction } from "@remix-run/node";
import { requireUser } from "~/lib/auth.server";
import { generateDateCourses } from "~/lib/course.server";
import { getUserPreferences, calculatePreferenceScore } from "~/lib/preferences.server";
import { createClient } from "~/lib/supabase.server";
import type { AdvancedFilters } from "~/types/preferences";

export const action: ActionFunction = async ({ request }) => {
  // POST 메소드만 허용
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 인증 확인
    const user = await requireUser(request);
    
    // 요청 본문 파싱
    const body = await request.json();
    const { regionId, date, timeSlotIds, filters } = body as {
      regionId: number;
      date: string;
      timeSlotIds: number[];
      filters: AdvancedFilters;
    };
    
    if (!regionId || !date || !timeSlotIds) {
      return json({ error: "지역, 날짜, 시간대 정보가 필요합니다." }, { status: 400 });
    }
    
    // Supabase 클라이언트 생성
    const supabase = createClient(request);
    
    // 사용자 선호도 조회
    const preferences = await getUserPreferences(supabase, user.id);
    
    // 필터와 선호도를 적용한 코스 생성
    const result = await generateDateCourses(request, {
      regionId,
      date,
      timeSlotIds,
      preferences: {
        theme: filters.weather?.preferIndoor ? 'indoor' : undefined,
        budgetRange: filters.budget,
        maxTravelTime: 30 // 기본 30분
      }
    });
    
    if (!result) {
      return json({ error: "코스 생성에 실패했습니다." }, { status: 500 });
    }
    
    return json({ 
      success: true, 
      courses: result.courses,
      generationId: result.generationId
    });
  } catch (error) {
    console.error("Error generating filtered course:", error);
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};