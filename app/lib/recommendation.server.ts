import { createSupabaseServerClient } from './supabase.server'

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