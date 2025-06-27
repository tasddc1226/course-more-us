import { PlaceScore } from './types'

export function ensureCategoryDiversity(
  scoredGroups: PlaceScore[],
  diversityWeight: number = 0.3,
): PlaceScore[] {
  // 카테고리별로 분류
  const categoryGroups = new Map<number, PlaceScore[]>()
  scoredGroups.forEach((ps) => {
    const categoryId = ps.place.category_id
    if (!categoryGroups.has(categoryId)) categoryGroups.set(categoryId, [])
    categoryGroups.get(categoryId)!.push(ps)
  })

  // 각 카테고리 내부 정렬
  for (const [, list] of categoryGroups) {
    list.sort((a, b) => b.score - a.score)
  }

  const maxPerCategory = Math.ceil(12 / Math.max(categoryGroups.size, 3))
  const result: PlaceScore[] = []
  const categoryCounts = new Map<number, number>()

  let round = 0
  while (result.length < 12 && round < maxPerCategory) {
    for (const [catId, list] of categoryGroups) {
      if (list.length > round) {
        const place = list[round]
        const currentCount = categoryCounts.get(catId) ?? 0
        const diversityPenalty = currentCount * diversityWeight * 10
        const adjustedScore = place.score - diversityPenalty

        result.push({
          ...place,
          score: adjustedScore,
        })

        categoryCounts.set(catId, currentCount + 1)
        if (result.length >= 12) break
      }
    }
    round++
  }

  return result.sort((a, b) => b.score - a.score)
}