import { createSupabaseServerClient } from './supabase.server'
import { 
  AdvancedRecommendationRequest, 
  RecommendationResponse, 
  RecommendedPlace,
  SupabasePlaceWithRelations 
} from './recommendation/types'
import { groupPlacesByLocation } from './recommendation/grouping'
import { calculateGroupScores } from './recommendation/scoring'
import { ensureCategoryDiversity } from './recommendation/diversity'
import { hasValidLocation, convertToRecommendationPlace } from './recommendation/utils'
import { getUserPreferences } from './preferences.server'
import type { UserPreferences } from '~/hooks/useUserPreferences'



// 추천 요청 데이터 타입
export interface RecommendationRequest {
  regionId: number
  date: string
  timeSlotIds: number[]
}

// 기본 추천 로직 (나중에 C 단계에서 확장)
export async function getRecommendations(
  request: Request, 
  { regionId, date, timeSlotIds }: RecommendationRequest
) {
  const supabase = createSupabaseServerClient(request)
  
  // 해당 지역과 시간대에 맞는 활성 장소들 조회
  const { data: places, error } = await supabase
    .from('places')
    .select(`
      *,
      regions(name),
      categories(name, icon),
      place_time_slots!inner(
        time_slot_id,
        priority,
        time_slots(name, start_time, end_time)
      )
    `)
    .eq('region_id', regionId)
    .eq('is_active', true)
    .in('place_time_slots.time_slot_id', timeSlotIds)
    .order('rating', { ascending: false })
    .limit(10)

  if (error) throw error
  
  return {
    places: places || [],
    requestInfo: {
      regionId,
      date,
      timeSlotIds
    }
  }
}

// 고급 추천 알고리즘 구현 (DAY8)
export async function getAdvancedRecommendations(
  request: Request,
  params: AdvancedRecommendationRequest,
  userId?: string,
): Promise<RecommendationResponse> {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient(request)

  // 사용자 선호도 가져오기 (있는 경우)
  let userPreferences: UserPreferences | null = null
  if (userId) {
    try {
      userPreferences = await getUserPreferences(supabase, userId)
    } catch (error) {
      console.log('Could not fetch user preferences:', error)
    }
  }

  // STEP 1: 기본 필터링된 장소 조회
  const rawPlaces = await fetchFilteredPlaces(request, params)

  // STEP 2: 위치 기반 그룹화
  // Supabase 타입을 recommendation Place 타입으로 변환
  const convertedPlaces = rawPlaces.map(convertToRecommendationPlace)
  const locationGroups = groupPlacesByLocation(convertedPlaces)

  // STEP 3: 그룹별 점수 계산 (사용자 선호도 포함)
  const scoredGroups = calculateGroupScores(
    locationGroups, 
    params.timeSlotIds, 
    userPreferences || undefined
  )

  // STEP 4: 카테고리 다양성 확보
  const diversePlaces = ensureCategoryDiversity(
    scoredGroups,
    params.diversityWeight ?? 0.3,
  )

  // STEP 5: 최종 정렬 및 제한
  const finalRecommendations = finalizeRecommendations(
    diversePlaces,
    params.maxResults ?? 12,
  )

  const endTime = Date.now()

  return {
    places: finalRecommendations,
    metadata: {
      totalCandidates: rawPlaces.length,
      filteringSteps: {
        initial: rawPlaces.length,
        afterLocationGrouping: locationGroups.length,
        afterDiversityFilter: diversePlaces.length,
        final: finalRecommendations.length,
      },
      executionTime: endTime - startTime,
      requestInfo: {
        regionId: params.regionId,
        date: params.date,
        timeSlotIds: params.timeSlotIds,
      },
    },
  }
}

// 내부 헬퍼들 -----------------------------------------------------------

async function fetchFilteredPlaces(
  request: Request,
  { regionId, timeSlotIds, priceMin, priceMax, minRating }: AdvancedRecommendationRequest,
) {
  const supabase = createSupabaseServerClient(request)

  let query = supabase
    .from('places')
    .select(
      `*,
      place_time_slots!inner(time_slot_id, priority),
      place_images(image_url, alt_text),
      categories(name, icon)`,
    )
    .eq('region_id', regionId)
    .eq('is_active', true)
    .in('place_time_slots.time_slot_id', timeSlotIds)

  // 최소 가격대 필터 적용 (사용자가 명시적으로 제공한 경우에만)
  if (priceMin !== undefined) {
    query = query.gte('price_range', priceMin)
  }

  // 최대 가격대 필터 적용 (사용자가 명시적으로 제공한 경우에만)
  if (priceMax !== undefined) {
    query = query.lte('price_range', priceMax)
  }

  // 최소 평점 필터 (사용자가 명시적으로 제공한 경우에만)
  if (minRating !== undefined) {
    query = query.gte('rating', minRating)
  }

  const { data, error } = await query

  if (error) throw error
  
  // 위치 정보가 있는 장소들만 필터링 (grouping 함수의 타입 요구사항에 맞춤)
  const rawData = data as SupabasePlaceWithRelations[]
  return rawData.filter(hasValidLocation)
}

function finalizeRecommendations(
  places: ReturnType<typeof ensureCategoryDiversity>,
  max: number,
): RecommendedPlace[] {
  return places
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((p) => ({
      ...p.place,
      recommendationScore: p.score,
      groupSize: p.groupSize,
      isPartnership: p.scoreBreakdown.partnership > 0,
      sources: p.sources,
      scoreBreakdown: p.scoreBreakdown,
    }))
} 