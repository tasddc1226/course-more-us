export interface AdvancedRecommendationRequest {
  regionId: number
  date: string
  timeSlotIds: number[]
  maxResults?: number // 기본값: 12
  diversityWeight?: number // 기본값: 0.3
}

export interface PlaceScore {
  place: any
  score: number
  scoreBreakdown: {
    partnership: number
    rating: number
    timeSlot: number
    popularity: number
    source: number
  }
  groupSize: number
  sources: string[]
}

export interface LocationGroup {
  locationKey: string
  places: any[]
  representative: any
  score: number
}

export interface RecommendedPlace extends Record<string, any> {
  recommendationScore: number
  groupSize: number
  isPartnership: boolean
  sources: string[]
}

export interface RecommendationResponse {
  places: RecommendedPlace[]
  metadata: {
    totalCandidates: number
    filteringSteps: {
      initial: number
      afterLocationGrouping: number
      afterDiversityFilter: number
      final: number
    }
    executionTime: number
    requestInfo: {
      regionId: number
      date: string
      timeSlotIds: number[]
    }
  }
}