import { SupabasePlaceWithRelations, Place } from './types'

// 타입 가드: 위치 정보가 있는 장소인지 확인
export function hasValidLocation(place: SupabasePlaceWithRelations): place is SupabasePlaceWithRelations & { latitude: number; longitude: number } {
  return place.latitude !== null && place.longitude !== null
}

// Supabase 타입을 recommendation Place 타입으로 변환
export function convertToRecommendationPlace(supabasePlace: SupabasePlaceWithRelations & { latitude: number; longitude: number }): Place {
  return {
    id: supabasePlace.id,
    name: supabasePlace.name,
    latitude: supabasePlace.latitude,
    longitude: supabasePlace.longitude,
    rating: supabasePlace.rating ?? undefined,
    created_at: supabasePlace.created_at,
    source: supabasePlace.source,
    is_partnership: supabasePlace.is_partnership ?? undefined,
    category_id: supabasePlace.category_id, // 카테고리 다양성 알고리즘을 위해 필수
    place_time_slots: supabasePlace.place_time_slots
      .filter(pts => pts.time_slot_id !== null) // null인 time_slot_id 제외
      .map(pts => ({
        time_slot_id: pts.time_slot_id as number, // 이미 null을 필터링했으므로 안전한 타입 캐스팅
        priority: pts.priority ?? undefined
      }))
  }
}