import { createSupabaseServerClient } from './supabase.server'
import { AdvancedRecommendationRequest, RecommendationResponse, RecommendedPlace } from './recommendation/types'
import { groupPlacesByLocation } from './recommendation/grouping'
import { calculateGroupScores } from './recommendation/scoring'
import { ensureCategoryDiversity } from './recommendation/diversity'

// 모든 지역 조회 (사용자용)
export async function getRegions(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

// 모든 시간대 조회 (사용자용)
export async function getTimeSlots(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .order('start_time')

  if (error) throw error
  return data
}

// 모든 카테고리 조회 (사용자용)
export async function getCategories(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

// 지역명으로 지역 찾기 또는 생성
export async function findOrCreateRegion(request: Request, regionName: string) {
  const supabase = createSupabaseServerClient(request)
  
  // 먼저 기존 지역 찾기
  const { data: existingRegion, error: findError } = await supabase
    .from('regions')
    .select('*')
    .eq('name', regionName)
    .single()

  if (findError && findError.code !== 'PGRST116') { // PGRST116은 "not found" 에러
    throw findError
  }

  // 기존 지역이 있으면 반환
  if (existingRegion) {
    return existingRegion
  }

  // slug 생성 (한글을 영문으로 변환하거나 단순화)
  const slug = regionName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')

  // 새 지역 생성
  const { data: newRegion, error: createError } = await supabase
    .from('regions')
    .insert({
      name: regionName,
      slug: slug,
      description: `사용자가 추가한 지역: ${regionName}`
    })
    .select()
    .single()

  if (createError) throw createError
  return newRegion
}

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
): Promise<RecommendationResponse> {
  const startTime = Date.now()

  // STEP 1: 기본 필터링된 장소 조회
  const rawPlaces = await fetchFilteredPlaces(request, params)

  // STEP 2: 위치 기반 그룹화
  const locationGroups = groupPlacesByLocation(rawPlaces)

  // STEP 3: 그룹별 점수 계산
  const scoredGroups = calculateGroupScores(locationGroups, params.timeSlotIds)

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
  { regionId, timeSlotIds }: AdvancedRecommendationRequest,
) {
  const supabase = createSupabaseServerClient(request)

  const { data, error } = await supabase
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

  if (error) throw error
  return data || []
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