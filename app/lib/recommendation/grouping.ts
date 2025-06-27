import { LocationGroup } from './types'

export function groupPlacesByLocation(places: any[]): LocationGroup[] {
  const locationGroups = new Map<string, any[]>()

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

export function selectRepresentativePlace(places: any[]): any {
  // 1) admin 소스, 2) 높은 평점, 3) 최신 등록 순
  const adminPlaces = places.filter((p: any) => p.source === 'admin')
  if (adminPlaces.length > 0) {
    return adminPlaces.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0))[0]
  }

  return places.sort((a: any, b: any) => {
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  })[0]
}