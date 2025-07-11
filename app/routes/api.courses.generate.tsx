import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUser } from "~/lib/auth.server";
import { generateDateCourses } from "~/lib/course.server";
import type { CourseGenerationRequest } from "~/types/course";

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  if (request.method !== 'POST') {
    return json({ error: '지원하지 않는 메서드입니다.' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    
    // 폼 데이터에서 요청 매개변수 추출
    const regionId = parseInt(formData.get('regionId') as string);
    const date = formData.get('date') as string;
    const timeSlotIds = formData.getAll('timeSlots').map(id => parseInt(id as string));
    
    // 선택적 매개변수
    const theme = formData.get('theme') as string || undefined;
    const budgetMin = formData.get('budgetMin') ? parseInt(formData.get('budgetMin') as string) : undefined;
    const budgetMax = formData.get('budgetMax') ? parseInt(formData.get('budgetMax') as string) : undefined;
    const maxTravelTime = formData.get('maxTravelTime') ? parseInt(formData.get('maxTravelTime') as string) : undefined;
    const excludeCategories = formData.getAll('excludeCategories').map(id => parseInt(id as string));

    // 유효성 검사
    if (!regionId || !date || timeSlotIds.length === 0) {
      return json({ 
        error: '지역, 날짜, 시간대는 필수 입력 항목입니다.' 
      }, { status: 400 });
    }

    if (timeSlotIds.some(id => isNaN(id))) {
      return json({ 
        error: '유효하지 않은 시간대 정보입니다.' 
      }, { status: 400 });
    }

    // 코스 생성 요청 객체 구성
    const courseRequest: CourseGenerationRequest = {
      regionId,
      date,
      timeSlotIds,
      preferences: {
        theme,
        budgetRange: (budgetMin !== undefined && budgetMax !== undefined) ? 
          { min: budgetMin, max: budgetMax } : undefined,
        excludeCategories: excludeCategories.length > 0 ? excludeCategories : undefined,
        maxTravelTime,
        prioritizeDistance: formData.get('prioritizeDistance') === 'true'
      }
    };

    // 코스 생성 실행
    const result = await generateDateCourses(request, courseRequest);

    return json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Course generation error:', error);
    
    // 에러 유형에 따른 메시지 분기
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return json({ 
          error: '코스 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' 
        }, { status: 408 });
      }
      
      if (error.message.includes('not found')) {
        return json({ 
          error: '선택하신 조건에 맞는 장소를 찾을 수 없습니다.' 
        }, { status: 404 });
      }
    }

    return json({ 
      error: '코스 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    }, { status: 500 });
  }
}

// GET 요청은 지원하지 않음
export async function loader() {
  return json({ error: 'GET 요청은 지원하지 않습니다.' }, { status: 405 });
}