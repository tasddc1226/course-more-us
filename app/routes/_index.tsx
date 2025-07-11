import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form, useNavigation } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";
import { getRegions, getTimeSlots } from "~/lib/data.server";
import { getAdvancedRecommendations } from "~/lib/recommendation.server";

import { getUserFeedbacksForPlaces, toggleFeedback, type FeedbackType } from "~/lib/feedback.server";
import { getUserFavoritesForPlaces, toggleFavorite } from "~/lib/favorites.server";

import { Button, Calendar, Dropdown, TimeSlotSelector, type DropdownOption } from "~/components/ui";
import { ROUTES } from "~/constants/routes";
import type { RecommendationResponse } from "~/lib/recommendation/types";
import type { Tables } from "~/types/database.types";
import type { CourseGenerationResponse } from "~/types/course";
import { SearchBar } from "~/components/common";
import { RecommendationResults, LoadingSkeleton } from "~/components/recommendation";
import { CourseCard, CourseDetail } from "~/components/course";
import { useState } from "react";

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
    // 캐싱된 API 호출로 rate limit 최적화
    const [regions, timeSlots] = await Promise.all([
      getRegions(request),
      getTimeSlots(request)
    ]);
    
    return json({ 
      user, 
      profile: null, 
      regions: regions as Tables<'regions'>[], 
      timeSlots: timeSlots as Tables<'time_slots'>[], 
      isAdmin: false, 
      error 
    });
  }
  
  return json({ 
    user, 
    profile: null, 
    regions: [] as Tables<'regions'>[], 
    timeSlots: [] as Tables<'time_slots'>[], 
    isAdmin: false, 
    error 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect(ROUTES.LOGIN);
  }

  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  // 즐겨찾기 처리
  if (intent === 'favorite') {
    const placeId = parseInt(formData.get('placeId') as string);

    if (!placeId) {
      return json({ 
        error: '장소 정보가 올바르지 않습니다.',
        recommendations: null,
        favoriteResult: null
      }, { status: 400 });
    }

    try {
      const result = await toggleFavorite(request, placeId);
      return json({ 
        error: null,
        recommendations: null,
        favoriteResult: {
          placeId,
          isFavorite: result.isFavorite
        }
      });
    } catch (error) {
      console.error('Favorite error:', error);
      return json({ 
        error: '즐겨찾기 처리 중 오류가 발생했습니다.',
        recommendations: null,
        favoriteResult: null
      }, { status: 500 });
    }
  }

  // 피드백 처리
  if (intent === 'feedback') {
    const placeId = parseInt(formData.get('placeId') as string);
    const feedbackType = formData.get('feedbackType') as FeedbackType;

    if (!placeId || !feedbackType) {
      return json({ 
        error: '피드백 정보가 올바르지 않습니다.',
        recommendations: null,
        feedbackResult: null
      }, { status: 400 });
    }

    try {
      const result = await toggleFeedback(request, placeId, feedbackType);
      return json({ 
        error: null,
        recommendations: null,
        feedbackResult: {
          placeId,
          feedbackType,
          isActive: result.action === 'created'
        }
      });
    } catch (error) {
      console.error('Feedback error:', error);
      return json({ 
        error: '피드백 처리 중 오류가 발생했습니다.',
        recommendations: null,
        feedbackResult: null
      }, { status: 500 });
    }
  }

  // 코스 추천 요청 처리
  const regionIdValue = formData.get('regionId')
  const date = formData.get('date') as string;
  const timeSlotIds = formData.getAll('timeSlots').map(id => parseInt(id as string));

  if (!regionIdValue || !date || timeSlotIds.length === 0) {
    return json({ 
      error: '모든 필드를 입력해주세요.',
      courses: null,
      userFeedbacks: null,
      userFavorites: null
    }, { status: 400 });
  }

  const regionId = parseInt(regionIdValue as string)
  if (isNaN(regionId)) {
    return json({ 
      error: '유효하지 않은 지역입니다.',
      courses: null,
      userFeedbacks: null,
      userFavorites: null
    }, { status: 400 });
  }

  try {
    // 코스 생성 API 호출을 위한 FormData 생성
    const courseFormData = new FormData();
    courseFormData.set('regionId', regionId.toString());
    courseFormData.set('date', date);
    timeSlotIds.forEach(id => courseFormData.append('timeSlots', id.toString()));

    // 내부 API 호출
    const courseRequest = new Request(new URL('/api/courses/generate', request.url).toString(), {
      method: 'POST',
      body: courseFormData,
      headers: request.headers,
    });

    const courseResponse = await fetch(courseRequest);
    const courseResult = await courseResponse.json();

    if (!courseResponse.ok) {
      return json({ 
        error: courseResult.error || '코스 생성 중 오류가 발생했습니다.',
        courses: null,
        userFeedbacks: null,
        userFavorites: null
      }, { status: courseResponse.status });
    }

    // 생성된 코스에서 모든 장소 ID 추출
    const allPlaceIds = courseResult.courses.flatMap((course: any) => 
      course.places.map((placeInfo: any) => placeInfo.place.id)
    );

    // 사용자 피드백, 즐겨찾기 정보 가져오기
    const [userFeedbacks, userFavorites] = await Promise.all([
      getUserFeedbacksForPlaces(request, allPlaceIds),
      getUserFavoritesForPlaces(request, allPlaceIds)
    ]);

    return json({ 
      error: null,
      courses: courseResult,
      userFeedbacks,
      userFavorites
    });
  } catch (error) {
    console.error('Course generation error:', error);
    return json({ 
      error: '데이트 코스 생성 중 오류가 발생했습니다.',
      courses: null,
      userFeedbacks: null,
      userFavorites: null
    }, { status: 500 });
  }
}

export default function Index() {
  const { user, regions, timeSlots, error, isAdmin: userIsAdmin } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isLoading = navigation.state === 'submitting';
  
  // 지역 선택 상태 관리
  const [selectedRegionId, setSelectedRegionId] = useState<string | number | null>(null);
  
  // 시간대 선택 상태 관리
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  
  // 선택된 코스 상태 관리
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  // 지역 옵션 변환
  const regionOptions: DropdownOption[] = regions.map(region => ({
    value: String(region.id),
    label: region.name,
    description: region.description || undefined
  }));

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
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">코스모스</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              안녕하세요, {(user.user_metadata as Record<string, unknown>)?.full_name as string || '사용자'}님!
            </span>
            <Link to={ROUTES.MY_PROFILE} className="relative">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="프로필"
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer">
                  <span className="text-lg text-purple-600">👤</span>
                </div>
              )}
              {user.app_metadata?.provider === 'kakao' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">K</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            오늘은 어떤 데이트를 해볼까요?
          </h2>
          <p className="text-gray-600 text-sm">
            원하는 방법을 선택해서 완벽한 데이트를 계획해보세요
          </p>
        </div>

        {/* 장소 검색 영역 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">장소 검색</h3>
              <p className="text-sm text-blue-600">원하는 장소를 바로 찾아보세요</p>
            </div>
          </div>
          <SearchBar />
          <p className="text-xs text-blue-500 mt-3">
            💡 태그, 지역명, 장소명으로 검색할 수 있어요
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-500 font-medium">또는</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* 맞춤 추천 영역 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-800">맞춤 데이트 코스 추천</h3>
              <p className="text-sm text-purple-600">AI가 선별한 완벽한 데이트 코스를 받아보세요</p>
            </div>
          </div>
          
          <Form method="post" className="space-y-6">
            {actionData?.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            {/* 지역 선택 */}
            <div>
              <Dropdown
                options={regionOptions}
                selectedValue={selectedRegionId}
                onSelect={setSelectedRegionId}
                label="지역 선택"
                placeholder="지역을 선택해주세요"
                required
                searchable
                variant="default"
              />
              {/* Form 전송용 hidden input */}
              {selectedRegionId && (
                <input
                  type="hidden"
                  name="regionId"
                  value={selectedRegionId}
                />
              )}
            </div>

            {/* 날짜 선택 */}
            <Calendar
              name="date"
              label="데이트 날짜"
              required
              minDate={new Date()}
              helperText="오늘 이후 날짜를 선택해주세요"
            />

            {/* 시간대 선택 */}
            <TimeSlotSelector
              timeSlots={timeSlots}
              selectedTimeSlots={selectedTimeSlots}
              onChange={setSelectedTimeSlots}
              label="희망 시간대"
              required={true}
              multiple={true}
              helperText="데이트하고 싶은 시간대를 선택해주세요"
            />
            
            {/* Form 전송용 hidden inputs */}
            {selectedTimeSlots.map(timeSlotId => (
              <input
                key={timeSlotId}
                type="hidden"
                name="timeSlots"
                value={timeSlotId}
              />
            ))}

            {/* 최소 평점 필터 */}
            <div>
              <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-2">
                최소 평점 (선택)
              </label>
              <select
                id="minRating"
                name="minRating"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">제한 없음</option>
                {[3,3.5,4,4.5,5].map((v)=>(
                  <option key={v} value={v}>{v.toFixed(1)} 이상</option>
                ))}
              </select>
            </div>

            {/* 가격대 필터 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                가격대 (선택)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="priceMin" className="text-sm text-gray-600 mb-1 block">
                    최소 💰
                  </label>
                  <select
                    id="priceMin"
                    name="priceMin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">제한 없음</option>
                    {[1,2,3,4,5].map((v)=>(
                      <option key={v} value={v}>{'💰'.repeat(v)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="priceMax" className="text-sm text-gray-600 mb-1 block">
                    최대 💰
                  </label>
                  <select
                    id="priceMax"
                    name="priceMax"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">제한 없음</option>
                    {[1,2,3,4,5].map((v)=>(
                      <option key={v} value={v}>{'💰'.repeat(v)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" size="lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  추천 중...
                </div>
              ) : (
                '맞춤 데이트 코스 추천받기 💕'
              )}
            </Button>
          </Form>
          
          <p className="text-xs text-purple-500 mt-4">
            🎯 선택하신 조건에 맞는 최적의 데이트 코스를 AI가 추천해드려요
          </p>
        </div>

        {/* 코스 추천 결과 */}
        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSkeleton />
            <p className="text-purple-600 mt-4 font-medium">
              완벽한 데이트 코스를 생성하고 있어요... ✨
            </p>
          </div>
        ) : actionData && 'courses' in actionData && actionData.courses ? (
          <div className="space-y-6">
            {/* 코스 목록 */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                ✨ 추천 데이트 코스 ✨
              </h3>
              <p className="text-sm text-gray-600">
                총 {(actionData.courses as CourseGenerationResponse).courses.length}개의 코스를 추천받았습니다
              </p>
              <div className="text-xs text-gray-500 mt-1">
                생성 시간: {(actionData.courses as CourseGenerationResponse).metadata.courseGenerationTime}ms
              </div>
            </div>

            <div className="grid gap-4">
              {(actionData.courses as CourseGenerationResponse).courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => setSelectedCourse(course.id === selectedCourse ? null : course.id)}
                  isSelected={selectedCourse === course.id}
                />
              ))}
            </div>

            {/* 선택된 코스 상세 */}
            {selectedCourse && (
              <div className="mt-8">
                {(() => {
                  const course = (actionData.courses as CourseGenerationResponse).courses.find(c => c.id === selectedCourse);
                  return course ? (
                    <CourseDetail
                      course={course}
                      showMap={true}
                      onClose={() => setSelectedCourse(null)}
                    />
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}


