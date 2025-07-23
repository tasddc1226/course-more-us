import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form, useNavigation } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";
import { getRegions, getTimeSlots } from "~/lib/data.server";
import { generateDateCourses, generateHybridDateCourses } from "~/lib/course.server";

import { getUserFeedbacksForPlaces, toggleFeedback, type FeedbackType } from "~/lib/feedback.server";
import { getUserFavoritesForPlaces, toggleFavorite } from "~/lib/favorites.server";

import { Button, Calendar, Dropdown, Select, TimeSlotSelector, type DropdownOption } from "~/components/ui";
import { ROUTES } from "~/constants/routes";
import type { Tables } from "~/types/database.types";
import type { CourseGenerationResponse, CoursePlaceInfo } from "~/types/course";
import { SearchBar } from "~/components/common";
import { LoadingSkeleton } from "~/components/recommendation";
import { CourseCard, CourseDetail } from "~/components/course";
import { AdvancedFilterPanel, type AdvancedFilters } from "~/components/filters";
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

  // AI 검색 요청 처리
  const userRequest = formData.get('userRequest') as string;
  const interestTags = formData.getAll('interestTags') as string[];
  const budgetRange = formData.get('budgetRange') as string;
  const includeTrends = formData.get('includeTrends') === 'true';
  const includeReviews = formData.get('includeReviews') === 'true';

  if (userRequest) {
    // AI 검색 모드
    console.log('🤖 AI 검색 요청 처리 시작');
    console.log('사용자 요청:', userRequest);
    
    try {
      // 사용자가 입력한 지역과 시간대 사용
      const regionIdValue = formData.get('regionId');
      const date = formData.get('date') as string;
      const timeSlotIds = formData.getAll('timeSlots').map(id => parseInt(id as string));
      
      // 기본값 설정 (사용자 입력이 없는 경우)
      const aiRegionId = regionIdValue ? parseInt(regionIdValue as string) : 1;
      const aiDate = date || new Date().toISOString().split('T')[0];
      const aiTimeSlotIds = timeSlotIds.length > 0 ? timeSlotIds : [3, 4, 5];
      
      console.log('사용자 지역 ID:', aiRegionId);
      console.log('사용자 날짜:', aiDate);
      console.log('사용자 시간대 IDs:', aiTimeSlotIds);
      
      const courseResult = await generateHybridDateCourses(request, {
        regionId: aiRegionId,
        date: aiDate,
        timeSlotIds: aiTimeSlotIds,
        searchRequest: {
          userRequest,
          interests: interestTags,
          budgetRange: budgetRange ? JSON.parse(budgetRange) : { min: 0, max: 999999 },
          includeTrends,
          includeReviews
        }
      });

      // 생성된 코스에서 모든 장소 ID 추출
      const allPlaceIds = courseResult.courses.flatMap((course) => 
        course.places
          .filter((placeInfo): placeInfo is CoursePlaceInfo => 'place' in placeInfo)
          .map((placeInfo) => placeInfo.place.id)
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
      console.error('AI Course generation error:', error);
      return json({ 
        error: 'AI 데이트 코스 생성 중 오류가 발생했습니다.',
        courses: null,
        userFeedbacks: null,
        userFavorites: null
      }, { status: 500 });
    }
  }

  // 기존 방식 코스 추천 요청 처리
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
    // 직접 코스 생성 함수 호출
    const courseResult = await generateDateCourses(request, {
      regionId,
      date,
      timeSlotIds
    });

    // 생성된 코스에서 모든 장소 ID 추출
    const allPlaceIds = courseResult.courses.flatMap((course) => 
      course.places.map((placeInfo) => placeInfo.place.id)
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
  const { user, regions, timeSlots, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isLoading = navigation.state === 'submitting';
  
  // 지역 선택 상태 관리
  const [selectedRegionId, setSelectedRegionId] = useState<string | number | null>(null);
  
  // 시간대 선택 상태 관리
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  
  // 선택된 코스 상태 관리
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  // 고급 필터 상태 관리
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters | null>(null);
  
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
              <Select
                label="최소 평점 (선택)"
                name="minRating"
                options={[
                  { value: "", label: "제한 없음" },
                  ...([3,3.5,4,4.5,5].map((v) => ({
                    value: String(v),
                    label: `${v.toFixed(1)} 이상`
                  })))
                ]}
                placeholder="제한 없음"
              />
            </div>

            {/* 가격대 필터 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                가격대 (선택)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Select
                    label="최소 💰"
                    name="priceMin"
                    options={[
                      { value: "", label: "제한 없음" },
                      ...([1,2,3,4,5].map((v) => ({
                        value: String(v),
                        label: '💰'.repeat(v)
                      })))
                    ]}
                    placeholder="제한 없음"
                  />
                </div>
                <div>
                  <Select
                    label="최대 💰"
                    name="priceMax"
                    options={[
                      { value: "", label: "제한 없음" },
                      ...([1,2,3,4,5].map((v) => ({
                        value: String(v),
                        label: '💰'.repeat(v)
                      })))
                    ]}
                    placeholder="제한 없음"
                  />
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
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
              className="w-full"
            >
              🔍 고급 필터 설정
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

            {/* AI 추가 검색 옵션 */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🤖</span>
                </div>
                <h4 className="text-lg font-bold text-emerald-800 mb-2">
                  검색 결과가 마음에 들지 않나요?
                </h4>
                <p className="text-sm text-emerald-600 mb-4">
                  AI에게 더 구체적으로 원하는 데이트를 설명해보세요!
                </p>
              </div>
              
              <Form method="post" className="space-y-4">
                {/* 기존 검색 파라미터를 hidden input으로 전달 */}
                <input type="hidden" name="regionId" value={selectedRegionId || ''} />
                <input type="hidden" name="date" value={new Date().toISOString().split('T')[0]} />
                {selectedTimeSlots.map(timeSlotId => (
                  <input
                    key={timeSlotId}
                    type="hidden"
                    name="timeSlots"
                    value={timeSlotId}
                  />
                ))}
                
                <div>
                  <label htmlFor="userRequest" className="block text-sm font-medium text-emerald-700 mb-2">
                    원하는 데이트를 자세히 설명해주세요
                  </label>
                  <textarea
                    id="userRequest"
                    name="userRequest"
                    rows={3}
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="예: 조용하고 아늑한 카페에서 디저트를 먹고, 야경이 예쁜 곳에서 산책하고 싶어요"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI 분석 중...
                    </div>
                  ) : (
                    '🚀 AI로 더 정확한 추천받기'
                  )}
                </Button>
              </Form>
              
              <p className="text-xs text-emerald-500 mt-3 text-center">
                💡 실시간 트렌드와 최신 리뷰를 반영한 맞춤 추천을 받아보세요
              </p>
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
      
      {/* 고급 필터 패널 */}
      <AdvancedFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={(filters) => {
          setAppliedFilters(filters);
          setIsFilterOpen(false);
          console.log('적용된 필터:', filters);
        }}
      />
    </div>
  );
}


