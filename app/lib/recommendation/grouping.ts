import { LocationGroup, Place } from './types'

export function groupPlacesByLocation(places: Place[]): LocationGroup[] {
  const locationGroups = new Map<string, Place[]>()

  places.forEach((place) => {
    // 소수점 3자리(약 100m) 단위로 반올림하여 위치 키 생성
    const lat = Math.round(place.latitude * 1000) / 1000
    const lng = Math.round(place.longitude * 1000) / 1000
    const locationKey = `${lat}_${lng}`

    if (!locationGroups.has(locationKey)) {
      locationGroups.set(locationKey, [])
    }

    locationGroups.get(locationKey)!.push(place)
  })

  return Array.from(locationGroups.entries()).map(([locationKey, grouped]) => {
    const representative = selectRepresentativePlace(grouped)

    return {
      locationKey,
      places: grouped,
      representative,
      score: 0,
    }
  })
}

export function selectRepresentativePlace(places: Place[]): Place {
  // 1) admin 소스, 2) 높은 평점, 3) 최신 등록 순
  const adminPlaces = places.filter((p) => p.source === 'admin')
  if (adminPlaces.length > 0) {
    return adminPlaces.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
  }

  return places.sort((a, b) => {
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff
    
    // created_at이 null/undefined인 경우를 안전하게 처리
    const aCreatedAt = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreatedAt = b.created_at ? new Date(b.created_at).getTime() : 0
    
    return bCreatedAt - aCreatedAt
  })[0]
}