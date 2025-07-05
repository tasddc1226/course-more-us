import type { TimeSlot, PlaceWithTimeSlots, TimeSlotGroup } from "~/types/recommendation";

/**
 * 시간대별로 장소를 그룹화하는 헬퍼 함수
 * @param places 추천된 장소들
 * @param timeSlots 전체 시간대 목록
 * @param selectedTimeSlotIds 선택된 시간대 ID들
 * @returns 시간대별로 그룹화된 장소들
 */
export function groupPlacesByTimeSlot(
  places: PlaceWithTimeSlots[], 
  timeSlots: TimeSlot[],
  selectedTimeSlotIds: number[]
): TimeSlotGroup[] {
  const groups: TimeSlotGroup[] = [];
  
  // 선택된 시간대만 순회
  const selectedTimeSlots = timeSlots.filter(ts => selectedTimeSlotIds.includes(ts.id));
  
  for (const timeSlot of selectedTimeSlots) {
    const placesForTimeSlot = places.filter(place => 
      place.place_time_slots?.some(pts => pts.time_slot_id === timeSlot.id)
    );
    
    // 해당 시간대에 맞는 장소가 있으면 그룹에 추가
    if (placesForTimeSlot.length > 0) {
      groups.push({
        timeSlot,
        places: placesForTimeSlot.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
      });
    }
  }
  
  return groups;
} 