import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { requireAdmin, getAllPlaces } from "~/lib/admin.server";

export const meta: MetaFunction = () => {
  return [
    { title: "관리자 대시보드 - 코스모스" },
    { name: "description", content: "코스모스 관리자 페이지" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAdmin(request);
  const places = await getAllPlaces(request);
  
  return json({ 
    user,
    placesCount: places.length,
    activePlacesCount: places.filter(p => p.is_active).length,
    partnershipPlacesCount: places.filter(p => p.is_partnership).length
  });
}

export default function AdminDashboard() {
  const { user, placesCount, activePlacesCount, partnershipPlacesCount } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">코스모스 관리자</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">관리자: {user.email}</span>
              <Link
                to="/"
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                사용자 페이지로
              </Link>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">📍</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 장소 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {placesCount}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      활성 장소
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {activePlacesCount}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">🤝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      제휴 장소
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {partnershipPlacesCount}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메뉴 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/places"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">🏢</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">장소 관리</h3>
                  <p className="text-sm text-gray-500">
                    장소 추가, 수정, 삭제
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/regions"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">🗺️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">지역 관리</h3>
                  <p className="text-sm text-gray-500">
                    지역 추가, 수정
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/categories"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">🏷️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">카테고리 관리</h3>
                  <p className="text-sm text-gray-500">
                    카테고리 추가, 수정
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/analytics"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">통계 분석</h3>
                  <p className="text-sm text-gray-500">
                    이용 현황 분석
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
} 