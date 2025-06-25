import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { getAllPlaces, deletePlace } from "~/lib/admin.server";
import { Button } from "~/components/ui";
import { PageHeader } from "~/components/common";
import { ROUTES } from "~/constants/routes";

export const meta: MetaFunction = () => {
  return [
    { title: "장소 관리 - 코스모스 관리자" },
    { name: "description", content: "등록된 장소들을 관리합니다" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const places = await getAllPlaces(request);
  return json({ places });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const placeId = formData.get('placeId') as string;

  if (intent === 'delete' && placeId) {
    await deletePlace(request, parseInt(placeId));
    return redirect('/admin/places');
  }

  return json({ success: false });
}

export default function AdminPlaces() {
  const { places } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleDelete = (placeId: number, placeName: string) => {
    if (confirm(`"${placeName}" 장소를 정말 삭제하시겠습니까?`)) {
      fetcher.submit(
        { intent: 'delete', placeId: placeId.toString() },
        { method: 'post' }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="장소 관리"
        backLink={{
          to: ROUTES.ADMIN,
          text: "관리자 대시보드"
        }}
        rightContent={
          <Link to={ROUTES.ADMIN_PLACES_NEW}>
            <Button>
              + 새 장소 추가
            </Button>
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {places.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 장소가 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 장소를 추가해보세요.</p>
            <Link to={ROUTES.ADMIN_PLACES_NEW}>
              <Button>
                장소 추가하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    장소명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지역
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제휴
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {places.map((place) => (
                  <tr key={place.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <span className="text-lg">
                              {place.categories?.icon || '🏢'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {place.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {place.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {place.categories?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {place.regions?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">⭐</span>
                        {place.rating ? place.rating.toFixed(1) : '0.0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        place.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {place.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        place.is_partnership 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {place.is_partnership ? '제휴' : '일반'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/places/${place.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          수정
                        </Link>
                        <Button
                          onClick={() => handleDelete(place.id, place.name)}
                          variant="danger"
                          size="sm"
                          disabled={fetcher.state === 'submitting'}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
} 