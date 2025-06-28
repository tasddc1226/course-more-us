import { LocationGroup, PlaceScore } from './types'

export function calculatePlaceScore(
  representative: any,
  group: any[],
  timeSlotIds: number[],
): PlaceScore {
  const scoreBreakdown = {
    partnership: 0,
    rating: 0,
    timeSlot: 0,
    popularity: 0,
    source: 0,
  }

  // 1. 제휴 여부 (최대 30)
  const hasPartnership = representative.is_partnership || group.some((p) => p.is_partnership)
  scoreBreakdown.partnership = hasPartnership ? 30 : 0

  // 2. 평점 (최대 25)
  scoreBreakdown.rating = ((representative.rating || 0) / 5) * 25

  // 3. 시간대 적합성 (최대 20)
  const timeSlotScore = (representative.place_time_slots || [])
    .filter((pts: any) => timeSlotIds.includes(pts.time_slot_id))
    .reduce((sum: number, pts: any) => sum + Math.max(11 - (pts.priority ?? 10), 1), 0)
  scoreBreakdown.timeSlot = Math.min(timeSlotScore, 20)

  // 4. 인기도 (최대 15) - 그룹 크기 기반
  scoreBreakdown.popularity = Math.min(group.length * 3, 15)

  // 5. 등록 소스 (최대 10) - admin 포함 여부
  const hasAdminSource = group.some((p) => p.source === 'admin')
  scoreBreakdown.source = hasAdminSource ? 10 : 0

  const totalScore = Object.values(scoreBreakdown).reduce((s, v) => s + v, 0)

  return {
    place: representative,
    score: totalScore,
    scoreBreakdown,
    groupSize: group.length,
    sources: [...new Set(group.map((p) => p.source))] as string[],
  }
}

export function calculateGroupScores(
  groups: LocationGroup[],
  timeSlotIds: number[],
): PlaceScore[] {
  return groups.map((group) =>
    calculatePlaceScore(group.representative, group.places, timeSlotIds),
  )
}