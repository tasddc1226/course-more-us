import { Database } from '~/types/database.types'

// Supabase 관련 타입들
export type SupabasePlaceWithRelations = Database['public']['Tables']['places']['Row'] & {
  place_time_slots: Array<{
    time_slot_id: number | null
    priority: number | null
  }>
  place_images: Array<{
    image_url: string
    alt_text: string | null
  }> | null
  categories: {
    name: string
    icon: string | null
  } | null
}

export interface AdvancedRecommendationRequest {
  regionId: number
  date: string
  timeSlotIds: number[]
  maxResults?: number // 기본값: 12
  diversityWeight?: number // 기본값: 0.3
}

export interface Place {
  id: number
  name: string
  latitude: number
  longitude: number
  rating?: number
  created_at?: string | null
  source: string
  is_partnership?: boolean
  place_time_slots?: Array<{
    time_slot_id: number
    priority?: number
  }>
}

export interface PlaceScore {
  place: Place
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
  places: Place[]
  representative: Place
  score: number
}

export interface RecommendedPlace extends Place {
  recommendationScore: number
  groupSize: number
  isPartnership: boolean
  sources: string[]
  scoreBreakdown?: {
    partnership: number
    rating: number
    timeSlot: number
    popularity: number
    source: number
  }
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