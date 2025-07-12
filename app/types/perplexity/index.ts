import type { Tables } from "~/types/database.types";
import type { RecommendedPlace } from "~/lib/recommendation/types";
import type { CoursePlaceInfo } from "~/types/course";

// 시간대 타입 (기존 course 타입에서 재사용)
export type TimeSlot = Tables<'time_slots'>;

// 지역 타입 (기존에서 재사용)
export type Region = Tables<'regions'>;

// Perplexity 검색 요청 인터페이스
export interface PerplexityCoursePlanningRequest {
  userRequest: string; // 사용자의 자연어 요청
  preferences: {
    interests: string[]; // 관심사 태그들
    budgetRange: { min: number; max: number }; // 예산 범위
    weatherCondition?: string; // 날씨 조건
    groupSize?: number; // 그룹 크기
    includeTrends: boolean; // 최신 트렌드 반영 여부
    includeReviews: boolean; // 실시간 리뷰 반영 여부
  };
  contextData: {
    selectedRegion: Region;
    selectedTimeSlots: TimeSlot[];
    selectedDate: string;
    availablePlaces: RecommendedPlace[]; // 해당 지역 등록된 장소들
  };
}

// Perplexity API 응답 인터페이스
export interface PerplexityAPIResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }[];
  citations?: string[];
}

// 검색 요약 정보
export interface SearchSummary {
  trendingPlaces: string[]; // 검색으로 발견한 인기 장소들
  seasonalEvents: string[]; // 해당 시기 특별 이벤트
  weatherConsiderations: string; // 날씨 관련 고려사항
}

// 검색 기반 장소 정보
export interface SearchBasedPlaceInfo {
  name: string;
  category: string;
  timeSlot: string;
  duration: number;
  isRegistered: boolean; // 기존 DB에 등록된 장소인지
  searchInfo: {
    recentReview: string; // 최신 리뷰 요약
    trendScore: number; // 트렌드 점수 (1-100)
    recommendationReason: string; // 검색 기반 추천 이유
  };
  specialTips: string; // 최신 정보 기반 특별 팁
}

// Perplexity 검색 기반 코스 추천 응답
export interface PerplexityCourseResponse {
  searchSummary: SearchSummary;
  recommendedCourse: {
    name: string;
    theme: string;
    description: string;
    reasoning: string; // 이 코스를 추천하는 이유 (검색 근거 포함)
    places: SearchBasedPlaceInfo[];
    realTimeAdvice: string[]; // 현재 상황 기반 실시간 조언들
  };
  citations?: string[]; // 검색 출처 URL들
}

// 확장된 코스 생성 요청 (기존 + 검색)
export interface ExtendedCourseRequest {
  // 기존 코스 생성 필드들
  regionId: number;
  date: string;
  timeSlotIds: number[];
  preferences?: {
    theme?: string;
    budgetRange?: { min: number; max: number };
    excludeCategories?: number[];
    maxTravelTime?: number;
    prioritizeDistance?: boolean;
  };
  
  // 새로운 검색 요청 필드들
  searchRequest?: {
    userRequest: string;
    interests: string[];
    budgetRange: { min: number; max: number };
    includeTrends: boolean;
    includeReviews: boolean;
  };
}

// 확장된 코스 생성 응답 (검색 메타데이터 포함)
export interface ExtendedCourseResponse {
  courses: ExtendedDateCourse[];
  hasSearchResults: boolean;
  searchMetadata?: {
    includedTrends: boolean;
    includedReviews: boolean;
    searchTimestamp: string;
  };
  generationId: string;
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

// 검색 정보가 포함된 확장 코스 타입
export interface ExtendedDateCourse {
  id: string;
  name: string;
  theme: string;
  description?: string;
  totalDuration: number;
  totalDistance: number;
  places: CoursePlaceInfo[] | SearchBasedPlaceInfo[]; // Union 타입으로 정의
  estimatedCost: {
    min: number;
    max: number;
  };
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  weatherSuitability: 'indoor' | 'outdoor' | 'mixed';
  
  // 검색 관련 추가 필드들
  isSearchRecommended?: boolean;
  searchInfo?: SearchSummary;
  citations?: string[];
  realTimeAdvice?: string[];
}

// 관심사 태그 상수
export const INTEREST_TAGS = [
  '음식', '카페', '문화예술', '액티비티', '쇼핑', 
  '자연', '역사', '사진', '음악', '독서',
  '영화', '전시', '공연', '스포츠', '게임'
] as const;

export type InterestTag = typeof INTEREST_TAGS[number];

// 예산 범위 옵션
export const BUDGET_RANGES = [
  { label: '2만원 이하', value: { min: 0, max: 20000 } },
  { label: '2-5만원', value: { min: 20000, max: 50000 } },
  { label: '5-10만원', value: { min: 50000, max: 100000 } },
  { label: '10만원 이상', value: { min: 100000, max: 999999 } }
] as const;

// Perplexity API 설정
export const PERPLEXITY_CONFIG = {
  baseUrl: 'https://api.perplexity.ai',
  model: 'llama-3.1-sonar-large-128k-online', // 온라인 검색 모델
  maxTokens: 3000,
  temperature: 0.7,
  searchDomainFilter: ['korean'], // 한국 도메인 우선 검색
  returnCitations: true
} as const; 