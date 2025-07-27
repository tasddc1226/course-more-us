import { json, type LoaderFunction } from "@remix-run/node";
import { requireUser } from "~/lib/auth.server";
import { getCourseEditHistory } from "~/lib/course-editor.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  const courseId = params.id;
  if (!courseId) {
    return json({ error: "코스 ID가 필요합니다." }, { status: 400 });
  }

  try {
    // 인증 확인
    const user = await requireUser(request);
    
    // 편집 이력 조회
    const history = await getCourseEditHistory(request, courseId, user.id);
    
    return json({ history });
  } catch (error) {
    console.error("Error fetching course history:", error);
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};