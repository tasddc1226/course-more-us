import { json, type ActionFunction } from "@remix-run/node";
import { requireUser } from "~/lib/auth.server";
import { saveEditedCourse, validateEditedCourse } from "~/lib/course-editor.server";
import type { DateCourse } from "~/types/course";

export const action: ActionFunction = async ({ request, params }) => {
  // POST 메소드만 허용
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const courseId = params.id;
  if (!courseId) {
    return json({ error: "코스 ID가 필요합니다." }, { status: 400 });
  }

  try {
    // 인증 확인
    const user = await requireUser(request);
    
    // 요청 본문 파싱
    const body = await request.json();
    const editedCourse = body.course as DateCourse;
    
    if (!editedCourse) {
      return json({ error: "편집된 코스 데이터가 필요합니다." }, { status: 400 });
    }
    
    // 코스 유효성 검증
    const validation = validateEditedCourse(editedCourse);
    if (!validation.isValid) {
      return json({ 
        error: "코스 유효성 검증 실패", 
        errors: validation.errors 
      }, { status: 400 });
    }
    
    // 편집된 코스 저장
    const success = await saveEditedCourse(request, courseId, user.id, editedCourse);
    
    if (!success) {
      return json({ error: "코스 저장에 실패했습니다." }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error("Error editing course:", error);
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};