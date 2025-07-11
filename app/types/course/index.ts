import type { Tables } from "~/types/database.types";
import type { RecommendedPlace } from "~/lib/recommendation/types";

// 시간대 타입
export type TimeSlot = Tables<'time_slots'>;

// 코스 내 장소 정보
export interface CoursePlaceInfo {
  place: RecommendedPlace;
  timeSlot: TimeSlot;
  suggestedDuration: number; // 권장 체류 시간 (분)
  order: number; // 방문 순서
  distanceFromPrevious?: number; // 이전 장소로부터의 거리 (미터)
  travelTimeFromPrevious?: number; // 이전 장소로부터의 이동 시간 (분)
}

// 데이트 코스
export interface DateCourse {
  id: string;
  name: string; // "A코스", "B코스", "낭만 코스" 등
  theme: string; // "로맨틱", "액티비티", "문화" 등
  description?: string; // 코스 설명
  totalDuration: number; // 예상 총 소요 시간 (분)
  totalDistance: number; // 총 이동 거리 (미터)
  places: CoursePlaceInfo[];
  estimatedCost: {
    min: number;
    max: number;
  };
  tags: string[]; // 코스 특징 태그
  difficulty: 'easy' | 'medium' | 'hard'; // 이동 난이도
  weatherSuitability: 'indoor' | 'outdoor' | 'mixed'; // 날씨 적합성
}

// 코스 생성 요청
export interface CourseGenerationRequest {
  regionId: number;
  date: string;
  timeSlotIds: number[];
  preferences?: {
    theme?: string;
    budgetRange?: { min: number; max: number };
    excludeCategories?: number[];
    maxTravelTime?: number; // 최대 이동 시간 (분)
    prioritizeDistance?: boolean; // 거리 우선 고려
  };
}

// 코스 생성 응답
export interface CourseGenerationResponse {
  courses: DateCourse[];
  generationId: string; // 임시 저장용 ID
  metadata: {
    totalCandidatePlaces: number;
    courseGenerationTime: number;
    requestInfo: {
      regionId: number;
      date: string;
      timeSlotIds: number[];
    };
  };
}

// 코스 테마 정의
export const COURSE_THEMES = {
  ROMANTIC: 'romantic',
  ACTIVITY: 'activity', 
  CULTURE: 'culture',
  FOOD: 'food',
  NATURE: 'nature',
  CAFE_HOPPING: 'cafe-hopping'
} as const;

export type CourseTheme = typeof COURSE_THEMES[keyof typeof COURSE_THEMES];

// 코스 테마별 설정
export const THEME_CONFIGS = {
  [COURSE_THEMES.ROMANTIC]: {
    name: '로맨틱 코스',
    description: '연인과 함께하는 달콤한 시간',
    icon: '💕',
    preferredCategories: ['cafe', 'restaurant', 'walking'],
    suggestedDuration: 180, // 3시간
    maxTravelTime: 15 // 15분
  },
  [COURSE_THEMES.ACTIVITY]: {
    name: '액티비티 코스',
    description: '활동적이고 재미있는 데이트',
    icon: '🏃‍♀️',
    preferredCategories: ['activity', 'shopping', 'restaurant'],
    suggestedDuration: 240, // 4시간
    maxTravelTime: 20 // 20분
  },
  [COURSE_THEMES.CULTURE]: {
    name: '문화 코스',
    description: '예술과 문화를 즐기는 교양 데이트',
    icon: '🎨',
    preferredCategories: ['culture', 'cafe', 'walking'],
    suggestedDuration: 200, // 3.5시간
    maxTravelTime: 15 // 15분
  },
  [COURSE_THEMES.FOOD]: {
    name: '맛집 탐방 코스',
    description: '맛있는 음식을 중심으로 한 데이트',
    icon: '🍴',
    preferredCategories: ['restaurant', 'cafe', 'pub'],
    suggestedDuration: 150, // 2.5시간
    maxTravelTime: 10 // 10분
  },
  [COURSE_THEMES.NATURE]: {
    name: '자연 힐링 코스',
    description: '자연 속에서 여유를 만끽하는 데이트',
    icon: '🌳',
    preferredCategories: ['walking', 'cafe', 'restaurant'],
    suggestedDuration: 200, // 3.5시간
    maxTravelTime: 25 // 25분
  },
  [COURSE_THEMES.CAFE_HOPPING]: {
    name: '카페 투어 코스',
    description: '다양한 카페를 즐기는 여유로운 데이트',
    icon: '☕',
    preferredCategories: ['cafe'],
    suggestedDuration: 180, // 3시간
    maxTravelTime: 10 // 10분
  }
} as const;

// 기본 체류 시간 (분) - 카테고리별
export const DEFAULT_DURATION_BY_CATEGORY = {
  cafe: 60,
  restaurant: 90,
  walking: 45,
  activity: 120,
  culture: 90,
  shopping: 90,
  pub: 120
} as const;