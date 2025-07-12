import type { 
  CourseGenerationRequest, 
  CourseGenerationResponse, 
  DateCourse, 
  CoursePlaceInfo, 
  TimeSlot, 
  CourseTheme
} from '~/types/course';
import { 
  COURSE_THEMES,
  THEME_CONFIGS,
  DEFAULT_DURATION_BY_CATEGORY
} from '~/types/course';
import type { RecommendedPlace } from './recommendation/types';
import { getTimeSlots } from './data.server';
import { getAdvancedRecommendations } from './recommendation.server';

/**
 * 데이트 코스 생성 메인 함수
 */
export async function generateDateCourses(
  request: Request,
  params: CourseGenerationRequest
): Promise<CourseGenerationResponse> {
  const startTime = Date.now();
  
  // 1. 기본 장소 추천 받기
  const recommendations = await getAdvancedRecommendations(request, {
    regionId: params.regionId,
    date: params.date,
    timeSlotIds: params.timeSlotIds,
    maxResults: 20, // 코스 생성을 위해 더 많은 결과 요청
    diversityWeight: 0.4 // 다양성 강화
  });

  // 2. 시간대 정보 가져오기
  const timeSlots = await getTimeSlots(request) as TimeSlot[];
  const selectedTimeSlots = timeSlots.filter((ts: TimeSlot) => 
    params.timeSlotIds.includes(ts.id)
  );

  // 3. 다양한 테마의 코스 생성
  const courses = await generateMultipleThemeCourses(
    recommendations.places,
    selectedTimeSlots,
    params
  );

  const endTime = Date.now();

  return {
    courses,
    generationId: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    metadata: {
      totalCandidatePlaces: recommendations.places.length,
      courseGenerationTime: endTime - startTime,
      requestInfo: {
        regionId: params.regionId,
        date: params.date,
        timeSlotIds: params.timeSlotIds
      }
    }
  };
}

/**
 * 여러 테마의 코스를 생성
 */
async function generateMultipleThemeCourses(
  places: RecommendedPlace[],
  timeSlots: TimeSlot[],
  params: CourseGenerationRequest
): Promise<DateCourse[]> {
  const courses: DateCourse[] = [];
  const usedPlaceCombinations: Set<string> = new Set();
  
  // 기본 3가지 테마 코스 생성
  const themes: CourseTheme[] = [
    COURSE_THEMES.ROMANTIC,
    COURSE_THEMES.ACTIVITY,
    COURSE_THEMES.CULTURE
  ];

  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    let attempts = 0;
    const maxAttempts = 3; // 최대 3번 시도
    
    while (attempts < maxAttempts) {
      const course = await generateThemeCourse(
        places,
        timeSlots,
        theme,
        `${String.fromCharCode(65 + i)}코스`, // A코스, B코스, C코스
        params
      );
      
      if (course) {
        // 장소 조합의 고유 식별자 생성 (장소 ID들을 정렬해서 조합)
        const placeIds = course.places.map(p => p.place.id).sort().join('-');
        
        if (!usedPlaceCombinations.has(placeIds)) {
          usedPlaceCombinations.add(placeIds);
          courses.push(course);
          break; // 성공적으로 추가했으므로 다음 테마로
        }
      }
      
      attempts++;
    }
  }

  // 추가로 사용자 선호도 기반 코스 생성
  if (params.preferences?.theme && courses.length < 3) {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && courses.length < 4) {
      const customCourse = await generateThemeCourse(
        places,
        timeSlots,
        params.preferences.theme as CourseTheme,
        '맞춤 코스',
        params
      );
      
      if (customCourse) {
        const placeIds = customCourse.places.map(p => p.place.id).sort().join('-');
        
        if (!usedPlaceCombinations.has(placeIds)) {
          usedPlaceCombinations.add(placeIds);
          courses.push(customCourse);
          break;
        }
      }
      
      attempts++;
    }
  }

  // 코스가 부족한 경우 다양성을 높이기 위해 추가 생성 시도
  if (courses.length < 2) {
    const alternativeThemes = Object.values(COURSE_THEMES).filter(t => !themes.includes(t));
    
    for (const theme of alternativeThemes) {
      if (courses.length >= 3) break;
      
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        const course = await generateThemeCourse(
          places,
          timeSlots,
          theme,
          `${String.fromCharCode(65 + courses.length)}코스`,
          params
        );
        
        if (course) {
          const placeIds = course.places.map(p => p.place.id).sort().join('-');
          
          if (!usedPlaceCombinations.has(placeIds)) {
            usedPlaceCombinations.add(placeIds);
            courses.push(course);
            break;
          }
        }
        
        attempts++;
      }
    }
  }

  return courses.slice(0, 4); // 최대 4개 코스 반환
}

/**
 * 특정 테마의 코스 생성
 */
async function generateThemeCourse(
  places: RecommendedPlace[],
  timeSlots: TimeSlot[],
  theme: CourseTheme,
  courseName: string,
  params: CourseGenerationRequest
): Promise<DateCourse | null> {
  const themeConfig = THEME_CONFIGS[theme];
  if (!themeConfig) return null;

  // 1. 테마에 맞는 장소 필터링
  const filteredPlaces = filterPlacesByTheme(places, theme);
  if (filteredPlaces.length === 0) return null;

  // 2. 시간대별로 장소 배치
  const coursePlaces = await arrangePlacesByTimeSlots(
    filteredPlaces,
    timeSlots,
    themeConfig.maxTravelTime,
    params.preferences?.maxTravelTime
  );

  if (coursePlaces.length === 0) return null;

  // 3. 코스 메타데이터 계산
  const courseMetadata = calculateCourseMetadata(coursePlaces);

  return {
    id: `course_${theme}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: courseName,
    theme,
    description: `${themeConfig.description} - ${coursePlaces.length}개 장소를 연결한 특별한 데이트 코스`,
    totalDuration: courseMetadata.totalDuration,
    totalDistance: courseMetadata.totalDistance,
    places: coursePlaces,
    estimatedCost: courseMetadata.estimatedCost,
    tags: generateCourseTags(coursePlaces, theme),
    difficulty: calculateDifficulty(courseMetadata.totalDistance, courseMetadata.totalDuration),
    weatherSuitability: determineWeatherSuitability(coursePlaces)
  };
}

/**
 * 테마에 맞는 장소 필터링
 */
function filterPlacesByTheme(places: RecommendedPlace[], theme: CourseTheme): RecommendedPlace[] {
  const themeConfig = THEME_CONFIGS[theme];
  
  return places.filter(place => {
    // 카테고리 확인 (place.categories가 있는 경우)
    if (place.categories?.name) {
      return themeConfig.preferredCategories.some(cat => 
        place.categories?.name.toLowerCase().includes(cat)
      );
    }
    
    // 태그로 확인 (place.tags가 있는 경우)
    if (place.tags && place.tags.length > 0) {
      return themeConfig.preferredCategories.some(cat => 
        place.tags!.some(tag => tag.toLowerCase().includes(cat))
      );
    }
    
    return true; // 기본적으로 포함
  });
}

/**
 * 시간대별로 장소 배치
 */
async function arrangePlacesByTimeSlots(
  places: RecommendedPlace[],
  timeSlots: TimeSlot[],
  maxTravelTime: number,
  userMaxTravelTime?: number
): Promise<CoursePlaceInfo[]> {
  const effectiveMaxTravelTime = userMaxTravelTime || maxTravelTime;
  const coursePlaces: CoursePlaceInfo[] = [];
  let previousPlace: RecommendedPlace | null = null;
  
  // 원본 배열을 변경하지 않기 위해 복사본 생성
  const availablePlaces = [...places];

  for (let i = 0; i < timeSlots.length; i++) {
    const timeSlot = timeSlots[i];
    
    // 해당 시간대에 적합한 장소 찾기
    const candidatePlaces = availablePlaces.filter(place => 
      place.place_time_slots?.some(pts => pts.time_slot_id === timeSlot.id)
    );

    if (candidatePlaces.length === 0) continue;

    // 이전 장소와의 거리 고려하여 최적 장소 선택
    let selectedPlace: RecommendedPlace;
    let distanceFromPrevious = 0;
    let travelTime = 0;

    if (previousPlace && candidatePlaces.length > 1) {
      // 거리 기반 최적화
      const placesWithDistance = candidatePlaces.map(place => {
        const distance = calculateDistance(
          previousPlace!.latitude,
          previousPlace!.longitude,
          place.latitude,
          place.longitude
        );
        return { place, distance };
      });

      // 최대 이동 시간 내의 장소들만 필터링
      const nearbyPlaces = placesWithDistance.filter(
        p => estimateTravelTime(p.distance) <= effectiveMaxTravelTime
      );

      if (nearbyPlaces.length > 0) {
        // 가장 가까우면서 점수가 높은 장소들 중에서 상위 후보들 선택
        nearbyPlaces.sort((a, b) => {
          const scoreA = (a.place.recommendationScore || 0) - (a.distance / 1000) * 5;
          const scoreB = (b.place.recommendationScore || 0) - (b.distance / 1000) * 5;
          return scoreB - scoreA;
        });
        
        // 상위 3개 후보 중에서 랜덤 선택 (다양성 증대)
        const topCandidates = nearbyPlaces.slice(0, Math.min(3, nearbyPlaces.length));
        const randomIndex = Math.floor(Math.random() * topCandidates.length);
        selectedPlace = topCandidates[randomIndex].place;
        distanceFromPrevious = topCandidates[randomIndex].distance;
        travelTime = estimateTravelTime(distanceFromPrevious);
      } else {
        // 최대 이동 시간을 초과하는 경우 가장 점수 높은 장소들 중 랜덤 선택
        const sortedByScore = candidatePlaces.sort((a, b) => 
          (b.recommendationScore || 0) - (a.recommendationScore || 0)
        );
        
        const topCandidates = sortedByScore.slice(0, Math.min(2, sortedByScore.length));
        const randomIndex = Math.floor(Math.random() * topCandidates.length);
        selectedPlace = topCandidates[randomIndex];
        
        if (previousPlace) {
          distanceFromPrevious = calculateDistance(
            previousPlace.latitude,
            previousPlace.longitude,
            selectedPlace.latitude,
            selectedPlace.longitude
          );
          travelTime = estimateTravelTime(distanceFromPrevious);
        }
      }
    } else {
      // 첫 번째 장소이거나 후보가 하나뿐인 경우
      const sortedByScore = candidatePlaces.sort((a, b) => 
        (b.recommendationScore || 0) - (a.recommendationScore || 0)
      );
      
      // 상위 2개 후보 중 랜덤 선택
      const topCandidates = sortedByScore.slice(0, Math.min(2, sortedByScore.length));
      const randomIndex = Math.floor(Math.random() * topCandidates.length);
      selectedPlace = topCandidates[randomIndex];
    }

    // 카테고리 기반 추천 체류 시간 계산
    const categoryKey = selectedPlace.categories?.name?.toLowerCase() as keyof typeof DEFAULT_DURATION_BY_CATEGORY;
    const suggestedDuration = DEFAULT_DURATION_BY_CATEGORY[categoryKey] || 60;

    coursePlaces.push({
      place: selectedPlace,
      timeSlot,
      suggestedDuration,
      order: i + 1,
      distanceFromPrevious: previousPlace ? distanceFromPrevious : undefined,
      travelTimeFromPrevious: previousPlace ? travelTime : undefined
    });

    previousPlace = selectedPlace;
    
    // 선택된 장소는 다음 선택에서 제외
    const selectedIndex = availablePlaces.findIndex(p => p.id === selectedPlace.id);
    if (selectedIndex > -1) {
      availablePlaces.splice(selectedIndex, 1);
    }
  }

  return coursePlaces;
}

/**
 * 두 지점 간의 직선 거리 계산 (미터)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * 거리 기반 이동 시간 추정 (분)
 */
function estimateTravelTime(distanceInMeters: number): number {
  // 도보 속도: 평균 4km/h, 대중교통 고려: 평균 15km/h
  if (distanceInMeters <= 500) {
    return Math.ceil(distanceInMeters / 67); // 도보 (4km/h)
  } else {
    return Math.ceil(distanceInMeters / 250); // 대중교통 (15km/h)
  }
}

/**
 * 코스 메타데이터 계산
 */
function calculateCourseMetadata(coursePlaces: CoursePlaceInfo[]) {
  const totalDuration = coursePlaces.reduce((sum, cp) => {
    return sum + cp.suggestedDuration + (cp.travelTimeFromPrevious || 0);
  }, 0);

  const totalDistance = coursePlaces.reduce((sum, cp) => {
    return sum + (cp.distanceFromPrevious || 0);
  }, 0);

  // 예상 비용 계산 (가격대 기반)
  const costs = coursePlaces.map(cp => {
    const priceRange = cp.place.price_range || 1;
    const basePrice = priceRange * 15000; // 가격대별 기본 단가
    return { min: basePrice * 0.7, max: basePrice * 1.3 };
  });

  const estimatedCost = {
    min: Math.round(costs.reduce((sum, c) => sum + c.min, 0)),
    max: Math.round(costs.reduce((sum, c) => sum + c.max, 0))
  };

  return {
    totalDuration,
    totalDistance,
    estimatedCost
  };
}

/**
 * 코스 태그 생성
 */
function generateCourseTags(coursePlaces: CoursePlaceInfo[], theme: CourseTheme): string[] {
  const tags = new Set<string>();
  
  // 테마 기반 태그
  const themeConfig = THEME_CONFIGS[theme];
  tags.add(themeConfig.name);
  
  // 장소 기반 태그
  coursePlaces.forEach(cp => {
    if (cp.place.categories?.name) {
      tags.add(cp.place.categories.name);
    }
    if (cp.place.tags) {
      cp.place.tags.forEach(tag => tags.add(tag));
    }
  });
  
  // 거리 기반 태그
  const totalDistance = coursePlaces.reduce((sum, cp) => sum + (cp.distanceFromPrevious || 0), 0);
  if (totalDistance < 1000) {
    tags.add('도보 가능');
  } else if (totalDistance < 3000) {
    tags.add('가까운 거리');
  }
  
  return Array.from(tags).slice(0, 6); // 최대 6개 태그
}

/**
 * 이동 난이도 계산
 */
function calculateDifficulty(totalDistance: number, totalDuration: number): 'easy' | 'medium' | 'hard' {
  if (totalDistance < 2000 && totalDuration < 180) {
    return 'easy';
  } else if (totalDistance < 5000 && totalDuration < 300) {
    return 'medium';
  } else {
    return 'hard';
  }
}

/**
 * 날씨 적합성 판단
 */
function determineWeatherSuitability(coursePlaces: CoursePlaceInfo[]): 'indoor' | 'outdoor' | 'mixed' {
  let indoorCount = 0;
  let outdoorCount = 0;

  coursePlaces.forEach(cp => {
    const category = cp.place.categories?.name?.toLowerCase();
    if (category?.includes('cafe') || category?.includes('restaurant') || 
        category?.includes('culture') || category?.includes('shopping')) {
      indoorCount++;
    } else if (category?.includes('walking') || category?.includes('park')) {
      outdoorCount++;
    }
  });

  if (indoorCount > outdoorCount * 2) return 'indoor';
  if (outdoorCount > indoorCount * 2) return 'outdoor';
  return 'mixed';
}

/**
 * 🔍 하이브리드 코스 생성 시스템 (Perplexity 검색 + 기존 알고리즘)
 */

import type { 
  PerplexityCoursePlanningRequest,
  ExtendedCourseRequest,
  ExtendedCourseResponse,
  ExtendedDateCourse,
  SearchBasedPlaceInfo
} from '~/types/perplexity';
import { generateCachedPerplexityCourse } from '~/lib/perplexity-course.server';
import { env } from '~/config/env';

/**
 * 확장된 코스 생성 함수 (검색 기반 + 기존 알고리즘)
 */
export async function generateHybridDateCourses(
  request: Request,
  params: ExtendedCourseRequest
): Promise<ExtendedCourseResponse> {
  const startTime = Date.now();

  // 1. 기본 장소 추천 받기
  const recommendations = await getAdvancedRecommendations(request, {
    regionId: params.regionId,
    date: params.date,
    timeSlotIds: params.timeSlotIds,
    maxResults: 20,
    diversityWeight: 0.4
  });

  // 2. 시간대 정보 가져오기
  const timeSlots = await getTimeSlots(request) as TimeSlot[];
  const selectedTimeSlots = timeSlots.filter((ts: TimeSlot) => 
    params.timeSlotIds.includes(ts.id)
  );

  const courses: ExtendedDateCourse[] = [];
  let hasSearchResults = false;

  // 3. Perplexity 검색 기반 AI 코스 생성 (우선순위)
  if (params.searchRequest?.userRequest && env.ENABLE_SEARCH_RECOMMENDATIONS) {
    try {
      const perplexityRequest: PerplexityCoursePlanningRequest = {
        userRequest: params.searchRequest.userRequest,
        preferences: {
          interests: params.searchRequest.interests || [],
          budgetRange: params.searchRequest.budgetRange || { min: 0, max: 100000 },
          includeTrends: params.searchRequest.includeTrends || false,
          includeReviews: params.searchRequest.includeReviews || false
        },
        contextData: {
          selectedRegion: await getRegionById(request, params.regionId),
          selectedTimeSlots,
          selectedDate: params.date,
          availablePlaces: recommendations.places
        }
      };

      const searchCourse = await generateCachedPerplexityCourse(perplexityRequest);
      const convertedCourse = await convertSearchCourseToDomainCourse(
        searchCourse, 
        recommendations.places, 
        selectedTimeSlots
      );
      
      if (convertedCourse) {
        courses.unshift(convertedCourse); // 검색 기반 코스를 맨 앞에 배치
        hasSearchResults = true;
      }
    } catch (error) {
      console.error('Perplexity 코스 생성 실패:', error);
      // 검색 실패 시 기존 코스로 폴백 (에러를 던지지 않음)
    }
  }

  // 4. 기존 테마별 코스 생성 (중복 제거 후 추가)
  const traditionalCourses = await generateMultipleThemeCourses(
    recommendations.places,
    selectedTimeSlots,
    params
  );
  
  // 중복 제거: 검색 기반 코스와 동일한 장소 조합인 전통 코스 제거
  const uniqueTraditionalCourses = filterDuplicateCourses(
    traditionalCourses, 
    courses
  );
  
  courses.push(...uniqueTraditionalCourses.map(course => ({
    ...course,
    isSearchRecommended: false
  })));

  const endTime = Date.now();

  return {
    courses: courses.slice(0, 4), // 최대 4개 코스
    hasSearchResults,
    searchMetadata: params.searchRequest ? {
      includedTrends: params.searchRequest.includeTrends || false,
      includedReviews: params.searchRequest.includeReviews || false,
      searchTimestamp: new Date().toISOString()
    } : undefined,
    generationId: `hybrid_course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * 중복 코스 필터링 (장소 조합이 동일한 코스 제거)
 */
function filterDuplicateCourses(
  candidateCourses: DateCourse[], 
  existingCourses: ExtendedDateCourse[]
): DateCourse[] {
  const existingCombinations = new Set(
    existingCourses.map(course => {
      const placeIds = course.places.map(p => {
        // SearchBasedPlaceInfo와 CoursePlaceInfo 모두 처리
        if ('place' in p) {
          return p.place.id; // CoursePlaceInfo의 경우
        } else {
          return p.name; // SearchBasedPlaceInfo의 경우 name 사용
        }
      }).sort().join('-');
      return placeIds;
    })
  );

  return candidateCourses.filter(course => {
    const placeIds = course.places.map(p => p.place.id).sort().join('-');
    return !existingCombinations.has(placeIds);
  });
}

/**
 * Perplexity 검색 결과를 도메인 코스로 변환
 */
async function convertSearchCourseToDomainCourse(
  searchCourse: {
    recommendedCourse: {
      name?: string;
      theme?: string;
      description?: string;
      places: SearchBasedPlaceInfo[];
      realTimeAdvice?: string[];
    };
    searchSummary: {
      trendingPlaces?: string[];
      seasonalEvents?: string[];
      weatherConsiderations?: string;
    };
    citations?: string[];
  },
  availablePlaces: RecommendedPlace[],
  timeSlots: TimeSlot[]
): Promise<ExtendedDateCourse | null> {
  try {
    const { recommendedCourse, searchSummary, citations } = searchCourse;
    
    // 검색 기반 장소들을 CoursePlaceInfo 형태로 변환
    const coursePlaces: CoursePlaceInfo[] = [];
    
    for (let i = 0; i < recommendedCourse.places.length; i++) {
      const searchPlace = recommendedCourse.places[i];
      
      // 기존 등록된 장소와 매칭 시도
      const matchedPlace = findMatchingPlace(searchPlace, availablePlaces);
      
      if (matchedPlace) {
        // 매칭된 경우 기존 장소 정보 사용
        const timeSlot = findTimeSlotByName(searchPlace.timeSlot, timeSlots);
        if (timeSlot) {
          coursePlaces.push({
            place: matchedPlace,
            timeSlot,
            suggestedDuration: searchPlace.duration || 60,
            order: i + 1,
            distanceFromPrevious: i > 0 ? calculateDistanceFromPrevious(coursePlaces, matchedPlace) : undefined,
            travelTimeFromPrevious: i > 0 ? estimateTravelTimeFromPrevious(coursePlaces, matchedPlace) : undefined
          });
        }
      }
      // 매칭되지 않은 새로운 장소는 일단 스킵 (향후 개선 가능)
    }

    if (coursePlaces.length === 0) return null;

    // 코스 메타데이터 계산
    const courseMetadata = calculateCourseMetadata(coursePlaces);

    return {
      id: `search_course_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: recommendedCourse.name || '🔍 AI 맞춤 추천 코스',
      theme: recommendedCourse.theme || '맞춤형',
      description: recommendedCourse.description,
      totalDuration: courseMetadata.totalDuration,
      totalDistance: courseMetadata.totalDistance,
      places: coursePlaces,
      estimatedCost: courseMetadata.estimatedCost,
      tags: generateSearchCourseTags(recommendedCourse, searchSummary),
      difficulty: calculateDifficulty(courseMetadata.totalDistance, courseMetadata.totalDuration),
      weatherSuitability: determineWeatherSuitability(coursePlaces),
      
      // 검색 관련 필드들
      isSearchRecommended: true,
      searchInfo: searchSummary,
      citations,
      realTimeAdvice: recommendedCourse.realTimeAdvice || []
    };

  } catch (error) {
    console.error('검색 코스 변환 실패:', error);
    return null;
  }
}

/**
 * 검색 기반 장소와 기존 등록된 장소 매칭
 */
function findMatchingPlace(
  searchPlace: SearchBasedPlaceInfo, 
  availablePlaces: RecommendedPlace[]
): RecommendedPlace | null {
  // 이름 기반 정확 매칭
  let matched = availablePlaces.find(place => 
    place.name.trim().toLowerCase() === searchPlace.name.trim().toLowerCase()
  );
  
  if (matched) return matched;

  // 이름 부분 매칭 (60% 이상 유사도)
  matched = availablePlaces.find(place => {
    const similarity = calculateStringSimilarity(
      place.name.trim().toLowerCase(), 
      searchPlace.name.trim().toLowerCase()
    );
    return similarity > 0.6;
  });

  return matched || null;
}

/**
 * 문자열 유사도 계산 (간단한 Jaccard 유사도)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 시간대 이름으로 TimeSlot 찾기
 */
function findTimeSlotByName(timeSlotName: string, timeSlots: TimeSlot[]): TimeSlot | null {
  return timeSlots.find(ts => 
    ts.name.includes(timeSlotName) || timeSlotName.includes(ts.name)
  ) || timeSlots[0]; // 기본값으로 첫 번째 시간대 반환
}

/**
 * 이전 장소로부터의 거리 계산
 */
function calculateDistanceFromPrevious(
  coursePlaces: CoursePlaceInfo[], 
  currentPlace: RecommendedPlace
): number {
  if (coursePlaces.length === 0) return 0;
  
  const previousPlace = coursePlaces[coursePlaces.length - 1].place;
  return calculateDistance(
    previousPlace.latitude,
    previousPlace.longitude,
    currentPlace.latitude,
    currentPlace.longitude
  );
}

/**
 * 이전 장소로부터의 이동 시간 계산
 */
function estimateTravelTimeFromPrevious(
  coursePlaces: CoursePlaceInfo[], 
  currentPlace: RecommendedPlace
): number {
  const distance = calculateDistanceFromPrevious(coursePlaces, currentPlace);
  return estimateTravelTime(distance);
}

/**
 * 검색 기반 코스 태그 생성
 */
function generateSearchCourseTags(recommendedCourse: any, searchSummary: any): string[] {
  const tags: string[] = [];
  
  // 테마 기반 태그
  if (recommendedCourse.theme) {
    tags.push(recommendedCourse.theme);
  }
  
  // 트렌딩 장소 기반 태그
  if (searchSummary.trendingPlaces?.length > 0) {
    tags.push('트렌딩', '인기');
  }
  
  // 계절 이벤트 기반 태그
  if (searchSummary.seasonalEvents?.length > 0) {
    tags.push('시즌특가', '이벤트');
  }
  
  // 장소 카테고리 기반 태그
  const categories = recommendedCourse.places?.map((p: any) => p.category) || [];
  const uniqueCategories = [...new Set(categories)];
  tags.push(...uniqueCategories);
  
  // 실시간 검색 태그
  tags.push('실시간', 'AI추천');
  
  return [...new Set(tags)].slice(0, 6); // 중복 제거 후 최대 6개
}

/**
 * 지역 정보 조회 (단순화된 버전)
 */
async function getRegionById(request: Request, regionId: number): Promise<any> {
  // 실제 구현에서는 데이터베이스에서 지역 정보를 조회해야 합니다.
  // 임시로 기본값 반환
  return {
    id: regionId,
    name: '홍대', // 기본값
    slug: 'hongdae'
  };
}