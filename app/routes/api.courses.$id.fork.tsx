import { json, type ActionFunction } from "@remix-run/node";
import { requireUser } from "~/lib/auth.server";
import { forkCourse } from "~/lib/course-editor.server";

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
    const newName = body.name as string | undefined;
    
    // 코스 복제
    const newCourseId = await forkCourse(request, courseId, user.id, newName);
    
    if (!newCourseId) {
      return json({ error: "코스 복제에 실패했습니다." }, { status: 500 });
    }
    
    return json({ 
      success: true, 
      newCourseId,
      redirectUrl: `/courses/${newCourseId}/edit`
    });
  } catch (error) {
    // Server error during course forking
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};