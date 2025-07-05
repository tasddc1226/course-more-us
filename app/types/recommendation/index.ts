import type { Tables } from "~/types/database.types";
import type { RecommendedPlace } from "~/lib/recommendation/types";

// 시간대 타입
export type TimeSlot = Tables<'time_slots'>;

// 시간대 정보가 포함된 장소 타입
export type PlaceWithTimeSlots = RecommendedPlace & {
  place_time_slots?: Array<{
    time_slot_id: number;
    priority?: number;
  }>;
  place_images?: Array<{
    image_url: string;
    alt_text?: string;
  }>;
  categories?: {
    name: string;
    icon?: string;
  };
  tags?: string[];
  description?: string;
  price_range?: number;
};

// 시간대별 장소 그룹
export type TimeSlotGroup = {
  timeSlot: TimeSlot;
  places: PlaceWithTimeSlots[];
};

// 피드백 상태 타입
export type FeedbackState = {
  like: boolean;
  dislike: boolean;
  visited: boolean;
}; 