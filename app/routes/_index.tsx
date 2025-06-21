import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";
import { getRegions, getTimeSlots, getRecommendations } from "~/lib/recommendation.server";
import { isAdmin } from "~/lib/admin.server";
import { Button, Input } from "~/components/ui";
import { ROUTES } from "~/constants/routes";
import { getTodayString } from "~/utils/date";

export const meta: MetaFunction = () => {
  return [
    { title: "코스모스 - 데이트 코스 추천 서비스" },
    { name: "description", content: "특별한 데이트 코스를 추천해드립니다" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  
  if (user) {
    // 로그인한 사용자에게는 추천 폼 데이터 제공
    const [regions, timeSlots, userIsAdmin] = await Promise.all([
      getRegions(request),
      getTimeSlots(request),
      isAdmin(request)
    ]);
    
    return json({ user, regions, timeSlots, isAdmin: userIsAdmin, error });
  }
  
  return json({ user, regions: [], timeSlots: [], isAdmin: false, error });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect(ROUTES.LOGIN);
  }

  const formData = await request.formData();
  const regionId = parseInt(formData.get('regionId') as string);
  const date = formData.get('date') as string;
  const timeSlotIds = formData.getAll('timeSlots').map(id => parseInt(id as string));

  if (!regionId || !date || timeSlotIds.length === 0) {
    return json({ 
      error: '모든 필드를 입력해주세요.',
      recommendations: null 
    }, { status: 400 });
  }

  try {
    const recommendations = await getRecommendations(request, {
      regionId,
      date,
      timeSlotIds
    });

    return json({ 
      error: null,
      recommendations 
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return json({ 
      error: '추천을 가져오는 중 오류가 발생했습니다.',
      recommendations: null 
    }, { status: 500 });
  }
}

export default function Index() {
  const { user, regions, timeSlots, isAdmin: userIsAdmin, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
              <Link to={ROUTES.LOGIN}>
                <Button size="lg" variant="white">
                  로그인
                </Button>
              </Link>
              <Link to={ROUTES.SIGNUP}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  회원가입
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error === 'auth_failed' && (
        <div className="bg-red-500 text-white text-center py-2">
          인증에 문제가 발생했습니다. 다시 로그인해주세요.
        </div>
      )}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">코스모스</h1>
          <div className="flex items-center space-x-4">
            <Link to={ROUTES.MY_PLACES}>
              <Button variant="outline" size="sm">
                내 장소
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="프로필"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-gray-700">
                안녕하세요, {user.user_metadata?.full_name || user.email}님!
              </span>
              {user.app_metadata?.provider === 'kakao' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  카카오
                </span>
              )}
            </div>
            {userIsAdmin && (
              <Link to={ROUTES.ADMIN}>
                <Button variant="primary" size="sm">
                  관리자
                </Button>
              </Link>
            )}
            <Form method="post" action={ROUTES.LOGOUT}>
              <Button type="submit" variant="danger" size="sm">
                로그아웃
              </Button>
            </Form>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            오늘은 어떤 데이트를 해볼까요?
          </h2>
          <p className="text-gray-600">
            지역과 시간을 선택하면 맞춤 데이트 코스를 추천해드려요
          </p>
        </div>

        {/* 추천 요청 폼 */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
          <Form method="post" className="space-y-6">
            {actionData?.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            {/* 지역 선택 */}
            <div>
              <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-2">
                지역 선택 <span className="text-red-500">*</span>
              </label>
              <select
                id="regionId"
                name="regionId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">지역을 선택해주세요</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 선택 */}
            <Input
              type="date"
              name="date"
              label="데이트 날짜"
              required
              min={getTodayString()}
              helperText="오늘 이후 날짜를 선택해주세요"
            />

            {/* 시간대 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                희망 시간대 <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-2">(복수 선택 가능)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((timeSlot) => (
                  <label
                    key={timeSlot.id}
                    className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="timeSlots"
                      value={timeSlot.id}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        {timeSlot.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeSlot.start_time} - {timeSlot.end_time}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              맞춤 데이트 코스 추천받기 💕
            </Button>
          </Form>
        </div>

        {/* 추천 결과 */}
        {actionData?.recommendations && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              ✨ 추천 데이트 코스 ✨
            </h3>
            {actionData.recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {actionData.recommendations.map((place: any) => (
                  <div key={place.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {place.place_images && place.place_images.length > 0 && (
                      <img
                        src={place.place_images[0].image_url}
                        alt={place.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{place.name}</h4>
                        <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {place.categories?.name}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {place.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1">{place.rating}</span>
                        </div>
                        <div className="flex items-center">
                          <span>💰</span>
                          <span className="ml-1">
                            {'₩'.repeat(place.price_level)}
                          </span>
                        </div>
                        {place.is_partnership && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            제휴
                          </span>
                        )}
                      </div>
                      {place.tags && place.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {place.tags.slice(0, 3).map((tag: string, index: number) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">😔</div>
                <p className="text-gray-600">
                  선택하신 조건에 맞는 데이트 코스가 없습니다.<br />
                  다른 지역이나 시간대를 선택해보세요.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


