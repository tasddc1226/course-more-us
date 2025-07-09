import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { requireAdmin, getAllPlaces, getAccountDeletionStats } from "~/lib/admin.server";
import { Button } from "~/components/ui";
import { PageHeader } from "~/components/common";
import { ROUTES } from "~/constants/routes";

export const meta: MetaFunction = () => {
  return [
    { title: "관리자 대시보드 - 코스모스" },
    { name: "description", content: "코스모스 관리자 페이지" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAdmin(request);
  const places = await getAllPlaces(request);
  const deletionStats = await getAccountDeletionStats(request);
  
  return json({ 
    user,
    placesCount: places.length,
    activePlacesCount: places.filter(p => p.is_active).length,
    partnershipPlacesCount: places.filter(p => p.is_partnership).length,
    deletionStats
  });
}

export default function AdminDashboard() {
  const { user, placesCount, activePlacesCount, partnershipPlacesCount, deletionStats } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="코스모스 관리자"
        rightContent={
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">관리자: {user.email}</span>
            <Link
              to={ROUTES.HOME}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              사용자 페이지로
            </Link>
            <Form method="post" action={ROUTES.LOGOUT}>
              <Button
                type="submit"
                variant="danger"
                size="sm"
              >
                로그아웃
              </Button>
            </Form>
          </div>
        }
      />

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
            to={ROUTES.ADMIN_PLACES}
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
            to={ROUTES.ADMIN_USERS}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">사용자 관리</h3>
                  <p className="text-sm text-gray-500">
                    사용자 역할, 권한 관리
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 탈퇴 사유 통계 */}
        {deletionStats.totalDeletions > 0 && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  회원 탈퇴 사유 통계 (총 {deletionStats.totalDeletions}건)
                </h3>
                <div className="space-y-3">
                  {deletionStats.reasonStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {stat.reason}
                          </span>
                          <span className="text-sm text-gray-500">
                            {stat.count}건 ({stat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 활동 */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                빠른 액션
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">새 장소 추가</h4>
                    <p className="text-sm text-gray-500">데이트 코스에 새로운 장소를 추가합니다</p>
                  </div>
                  <Link to={ROUTES.ADMIN_PLACES_NEW}>
                    <Button variant="primary">
                      장소 추가
                    </Button>
                  </Link>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">전체 장소 관리</h4>
                      <p className="text-sm text-gray-500">기존 장소들을 조회하고 수정합니다</p>
                    </div>
                    <Link to={ROUTES.ADMIN_PLACES}>
                      <Button variant="secondary">
                        장소 목록
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 