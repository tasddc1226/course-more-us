import { LocationGroup, PlaceScore } from './types'
import type { UserPreferences } from '~/hooks/useUserPreferences'

export function calculatePlaceScore(
  representative: any,
  group: any[],
  timeSlotIds: number[],
  userPreferences?: UserPreferences,
): PlaceScore {
  const scoreBreakdown = {
    partnership: 0,
    rating: 0,
    timeSlot: 0,
    popularity: 0,
    source: 0,
    preference: 0, // 새로운 선호도 점수
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

  // 6. 사용자 선호도 (최대 15)
  if (userPreferences) {
    scoreBreakdown.preference = calculatePreferenceScore(representative, userPreferences)
  }

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
  userPreferences?: UserPreferences,
): PlaceScore[] {
  return groups.map((group) =>
    calculatePlaceScore(group.representative, group.places, timeSlotIds, userPreferences),
  )
}

// 사용자 선호도 기반 점수 계산 (최대 15점)
function calculatePreferenceScore(place: any, userPreferences: UserPreferences): number {
  let score = 0

  // 카테고리 선호도 (최대 8점)
  if (place.category && userPreferences.categoryPreferences[place.category]) {
    score += (userPreferences.categoryPreferences[place.category] / 100) * 8
  }

  // 가격대 매칭 (최대 4점)
  if (place.price_level) {
    const avgPrice = place.price_level * 20000 // 대략적인 가격 계산
    if (avgPrice >= userPreferences.priceRangeMin && avgPrice <= userPreferences.priceRangeMax) {
      score += 4
    } else {
      // 가격대가 약간 벗어나도 부분 점수 부여
      const range = userPreferences.priceRangeMax - userPreferences.priceRangeMin
      const deviation = Math.min(
        Math.abs(avgPrice - userPreferences.priceRangeMin),
        Math.abs(avgPrice - userPreferences.priceRangeMax)
      )
      if (deviation <= range * 0.5) {
        score += 2
      }
    }
  }

  // 테마 매칭 (최대 3점)
  if (place.tags && userPreferences.preferredThemes.length > 0) {
    const matchingThemes = place.tags.filter((tag: string) =>
      userPreferences.preferredThemes.some(theme => 
        tag.toLowerCase().includes(theme.toLowerCase()) ||
        theme.toLowerCase().includes(tag.toLowerCase())
      )
    )
    score += Math.min(matchingThemes.length * 1.5, 3)
  }

  return Math.min(score, 15)
}