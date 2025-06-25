import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData, Link } from "@remix-run/react";
import { getRegions, getCategories, getTimeSlots, createPlace, updatePlaceTimeSlots } from "~/lib/admin.server";
import { Button, Input } from "~/components/ui";
import { ROUTES } from "~/constants/routes";

export const meta: MetaFunction = () => {
  return [
    { title: "새 장소 추가 - 코스모스 관리자" },
    { name: "description", content: "새로운 장소를 등록합니다" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const [regions, categories, timeSlots] = await Promise.all([
    getRegions(request),
    getCategories(request),
    getTimeSlots(request)
  ]);

  return json({ regions, categories, timeSlots });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    // 태그 처리
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // 영업시간 처리 (JSON 형태)
    const operatingHours = {
      monday: formData.get('hours_monday') as string || '',
      tuesday: formData.get('hours_tuesday') as string || '',
      wednesday: formData.get('hours_wednesday') as string || '',
      thursday: formData.get('hours_thursday') as string || '',
      friday: formData.get('hours_friday') as string || '',
      saturday: formData.get('hours_saturday') as string || '',
      sunday: formData.get('hours_sunday') as string || '',
    };

    // 기본 장소 정보
    const placeData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
      phone: formData.get('phone') as string || null,
      website: formData.get('website') as string || null,
      rating: parseFloat(formData.get('rating') as string) || 0,
      price_range: parseInt(formData.get('price_range') as string) || 1,
      is_partnership: formData.get('is_partnership') === 'on',
      region_id: parseInt(formData.get('region_id') as string),
      category_id: parseInt(formData.get('category_id') as string),
      is_active: formData.get('is_active') === 'on',
      tags,
      operating_hours: operatingHours
    };

    // 장소 생성
    const newPlace = await createPlace(request, placeData);

    // 시간대 연결 처리
    const timeSlotConnections = [];
    const timeSlotIds = formData.getAll('time_slots');
    
    for (const timeSlotId of timeSlotIds) {
      const priority = parseInt(formData.get(`priority_${timeSlotId}`) as string) || 1;
      timeSlotConnections.push({
        time_slot_id: parseInt(timeSlotId as string),
        priority
      });
    }

    if (timeSlotConnections.length > 0) {
      await updatePlaceTimeSlots(request, newPlace.id, timeSlotConnections);
    }

    return redirect(`/admin/places`);
  } catch (error) {
    // Error handling without console.log
    return json({ 
      error: '장소 생성 중 오류가 발생했습니다.',
      values: Object.fromEntries(formData)
    }, { status: 400 });
  }
}

export default function NewPlace() {
  const { regions, categories, timeSlots } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.ADMIN_PLACES}
                className="text-purple-600 hover:text-purple-700"
              >
                ← 장소 목록
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">새 장소 추가</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <Form method="post" className="p-6 space-y-6">
            {actionData?.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="장소명"
                  name="name"
                  required
                  placeholder="장소명을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-2">
                  지역 <span className="text-red-500">*</span>
                </label>
                <select
                  id="region_id"
                  name="region_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">지역 선택</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="평점 (0.0 ~ 5.0)"
                  type="number"
                  name="rating"
                  min={0}
                  max={5}
                  step={0.1}
                  defaultValue="4.0"
                />
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="장소에 대한 설명을 입력하세요"
              />
            </div>

            {/* 위치 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">위치 정보</h3>
              <div>
                <Input
                  label="주소"
                  name="address"
                  required
                  placeholder="전체 주소를 입력하세요"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="위도"
                    type="number"
                    name="latitude"
                    step="any"
                    required
                    placeholder="37.123456"
                  />
                </div>
                <div>
                  <Input
                    label="경도"
                    type="number"
                    name="longitude"
                    step="any"
                    required
                    placeholder="127.123456"
                  />
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">연락처 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="전화번호"
                    name="phone"
                    placeholder="02-123-4567"
                  />
                </div>
                <div>
                  <Input
                    label="웹사이트"
                    name="website"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* 가격 및 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">가격 및 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="price_range" className="block text-sm font-medium text-gray-700 mb-2">
                    가격대 (1~5)
                  </label>
                  <select
                    id="price_range"
                    name="price_range"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="1">💰 저렴함</option>
                    <option value="2">💰💰 보통</option>
                    <option value="3">💰💰💰 비쌈</option>
                    <option value="4">💰💰💰💰 매우 비쌈</option>
                    <option value="5">💰💰💰💰💰 최고급</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_partnership"
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>제휴 장소</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>활성화</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div>
              <Input
                label="태그 (콤마로 구분)"
                name="tags"
                placeholder="로맨틱, 야경, 조용함"
              />
              <p className="mt-1 text-sm text-gray-500">
                각 태그를 콤마(,)로 구분해서 입력하세요.
              </p>
            </div>

            {/* 영업시간 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">영업시간</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { key: 'monday', label: '월요일' },
                  { key: 'tuesday', label: '화요일' },
                  { key: 'wednesday', label: '수요일' },
                  { key: 'thursday', label: '목요일' },
                  { key: 'friday', label: '금요일' },
                  { key: 'saturday', label: '토요일' },
                  { key: 'sunday', label: '일요일' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium text-gray-700">
                      {label}
                    </div>
                    <Input
                      name={`hours_${key}`}
                      placeholder="09:00-18:00 또는 휴무"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 시간대 선택 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">추천 시간대</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot.id} className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="time_slots"
                        value={timeSlot.id}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {timeSlot.name}
                      </span>
                    </label>
                    <Input
                      label="우선순위"
                      type="number"
                      name={`priority_${timeSlot.id}`}
                      min={1}
                      max={10}
                      defaultValue="5"
                      className="w-16"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link to={ROUTES.ADMIN_PLACES}>
                <Button variant="secondary">
                  취소
                </Button>
              </Link>
              <Button type="submit">
                장소 추가
              </Button>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
} 