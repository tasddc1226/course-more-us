import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "코스모스 - 데이트 코스 추천 서비스" },
    { name: "description", content: "특별한 데이트 코스를 추천해드립니다" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              코스모스
            </h1>
            <p className="text-xl text-white/90 mb-8">
              특별한 데이트 코스를 추천해드립니다
            </p>
            <div className="space-x-4">
              <Link
                to="/auth/login"
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/auth/signup"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">코스모스</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">안녕하세요, {user.email}님!</span>
            <Form method="post" action="/auth/logout">
              <button
                type="submit"
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </Form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            오늘은 어떤 데이트를 해볼까요?
          </h2>
        </div>
      </main>
    </div>
  );
}


