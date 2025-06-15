import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Chrome DevTools 관련 요청은 조용히 처리
  if (url.pathname.includes('.well-known') || url.pathname.includes('devtools')) {
    return new Response(null, { status: 404 });
  }
  
  // 다른 404는 일반적으로 처리
  throw json({ message: "페이지를 찾을 수 없습니다." }, { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">페이지를 찾을 수 없습니다.</p>
        <a
          href="/"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
} 