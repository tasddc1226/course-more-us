/**
 * 사용자 선호도 학습 시스템 타입 정의
 * 
 * 사용자 행동 이벤트, 선호도 프로필, 개인화 가중치 등 핵심 타입들을 정의합니다.
 */

// ============================================================================
// 사용자 행동 이벤트 타입
// ============================================================================

/**
 * 사용자 행동 이벤트 타입
 */
export type UserBehaviorEventType = 'click' | 'view' | 'dwell' | 'search' | 'feedback'

/**
 * 이벤트 대상 타입
 */
export type EventTargetType = 'place' | 'category' | 'region' | 'tag'

/**
 * 피드백 타입
 */
export type FeedbackType = 'like' | 'dislike'

/**
 * 사용자 행동 이벤트 메타데이터
 */
export interface UserBehaviorEventMetadata {
  /** 체류 시간 (밀리초) */
  dwellTime?: number
  /** 검색 쿼리 */
  searchQuery?: string
  /** 피드백 타입 */
  feedbackType?: FeedbackType
  /** 추가 컨텍스트 정보 */
  context?: Record<string, any>
  /** 이벤트 발생 페이지 */
  page?: string
  /** 추천 세션 ID */
  recommendationSessionId?: string
}

/**
 * 사용자 행동 이벤트 인터페이스
 */
export interface UserBehaviorEvent {
  /** 사용자 ID */
  userId: string
  /** 이벤트 타입 */
  eventType: UserBehaviorEventType
  /** 대상 타입 */
  targetType: EventTargetType
  /** 대상 ID */
  targetId: string
  /** 메타데이터 */
  metadata?: UserBehaviorEventMetadata
  /** 이벤트 발생 시간 */
  timestamp?: Date
}

// ============================================================================
// 선호도 프로필 타입
// ============================================================================

/**
 * 선호도 점수 (-1 ~ 1 범위)
 * -1: 매우 싫어함, 0: 중립, 1: 매우 좋아함
 */
export type PreferenceScore = number

/**
 * 카테고리별 선호도
 */
export interface CategoryPreferences {
  [categoryId: string]: PreferenceScore
}

/**
 * 가격대별 선호도 (1~5 가격대)
 */
export interface PriceRangePreferences {
  [priceRange: number]: PreferenceScore
}

/**
 * 지역별 선호도
 */
export interface RegionPreferences {
  [regionId: string]: PreferenceScore
}

/**
 * 태그별 선호도
 */
export interface TagPreferences {
  [tag: string]: PreferenceScore
}

/**
 * 검색 패턴 정보
 */
export interface SearchPattern {
  /** 검색어 */
  query: string
  /** 사용 빈도 */
  frequency: number
  /** 마지막 사용 시간 */
  lastUsed: Date
}

/**
 * 사용자 선호도 프로필
 */
export interface UserPreferenceProfile {
  /** 사용자 ID */
  userId: string
  /** 카테고리별 선호도 점수 */
  categoryPreferences: CategoryPreferences
  /** 가격대별 선호도 점수 */
  priceRangePreferences: PriceRangePreferences
  /** 지역별 선호도 점수 */
  regionPreferences: RegionPreferences
  /** 태그별 선호도 점수 */
  tagPreferences: TagPreferences
  /** 검색 패턴 */
  searchPatterns: SearchPattern[]
  /** 마지막 업데이트 시간 */
  lastUpdated: Date
  /** 학습 데이터의 신뢰도 (0 ~ 1) */
  confidenceScore: number
  /** 총 이벤트 수 */
  totalEvents: number
}

// ============================================================================
// 개인화 가중치 타입
// ============================================================================

/**
 * 개인화 가중치
 */
export interface PersonalizationWeights {
  /** 카테고리 부스트 점수 (최대 20점) */
  categoryBoost: number
  /** 가격대 부스트 점수 (최대 15점) */
  priceRangeBoost: number
  /** 지역 부스트 점수 (최대 10점) */
  regionBoost: number
  /** 태그 부스트 점수 (최대 10점) */
  tagBoost: number
}

/**
 * 개인화된 장소 점수
 */
export interface PersonalizedPlaceScore {
  /** 기본 점수 */
  baseScore: number
  /** 개인화 가중치 */
  personalizationWeights: PersonalizationWeights
  /** 최종 점수 */
  finalScore: number
  /** 개인화 적용 여부 */
  isPersonalized: boolean
}

// ============================================================================
// 선호도 프로필 관리 타입
// ============================================================================

/**
 * 선호도 분포 데이터
 */
export interface PreferenceDistribution {
  /** 항목명 (카테고리명, 지역명 등) */
  name: string
  /** 선호도 점수 */
  score: PreferenceScore
  /** 관련 이벤트 수 */
  count: number
  /** 백분율 */
  percentage: number
}

/**
 * 선호도 프로필 표시 데이터
 */
export interface PreferenceProfileData {
  /** 카테고리 분포 */
  categoryDistribution: PreferenceDistribution[]
  /** 가격대 분포 */
  priceRangeDistribution: PreferenceDistribution[]
  /** 지역 분포 */
  regionDistribution: PreferenceDistribution[]
  /** 인기 태그 */
  topTags: PreferenceDistribution[]
  /** 검색 패턴 */
  searchPatterns: Array<{
    query: string
    frequency: number
    lastUsed: Date
  }>
  /** 학습 통계 */
  learningStats: {
    totalEvents: number
    confidenceScore: number
    lastUpdated: Date
    learningDuration: number // 학습 기간 (일)
  }
}

/**
 * 선호도 수동 조정 요청
 */
export interface PreferenceAdjustmentRequest {
  /** 조정 타입 */
  type: 'category' | 'priceRange' | 'region' | 'tag'
  /** 대상 ID */
  targetId: string
  /** 조정 값 (-1 ~ 1) */
  adjustment: PreferenceScore
}

// ============================================================================
// 학습 통계 및 분석 타입
// ============================================================================

/**
 * 사용자 학습 통계
 */
export interface UserLearningStats {
  /** 사용자 ID */
  userId: string
  /** 총 이벤트 수 */
  totalEvents: number
  /** 마지막 분석 시간 */
  lastAnalysisAt: Date
  /** 학습 품질 점수 (0 ~ 1) */
  learningQualityScore: number
  /** 이벤트 타입별 분포 */
  eventTypeDistribution: Record<UserBehaviorEventType, number>
  /** 학습 활성화 여부 */
  isLearningEnabled: boolean
}

/**
 * 전체 학습 시스템 통계
 */
export interface SystemLearningStats {
  /** 총 사용자 수 */
  totalUsers: number
  /** 학습 활성화 사용자 수 */
  activeUsers: number
  /** 총 이벤트 수 */
  totalEvents: number
  /** 평균 신뢰도 점수 */
  averageConfidenceScore: number
  /** 개인화 추천 성능 지표 */
  performanceMetrics: {
    /** 개인화 추천 클릭률 */
    personalizedClickRate: number
    /** 기본 추천 클릭률 */
    baselineClickRate: number
    /** 개선율 */
    improvementRate: number
  }
}

// ============================================================================
// API 요청/응답 타입
// ============================================================================

/**
 * 이벤트 수집 API 요청
 */
export interface TrackEventRequest {
  events: UserBehaviorEvent[]
}

/**
 * 이벤트 수집 API 응답
 */
export interface TrackEventResponse {
  success: boolean
  processedEvents: number
  errors?: string[]
}

/**
 * 선호도 프로필 조회 응답
 */
export interface GetPreferenceProfileResponse {
  profile: UserPreferenceProfile
  displayData: PreferenceProfileData
}

/**
 * 선호도 업데이트 요청
 */
export interface UpdatePreferenceRequest {
  adjustments: PreferenceAdjustmentRequest[]
}

/**
 * 선호도 업데이트 응답
 */
export interface UpdatePreferenceResponse {
  success: boolean
  updatedProfile: UserPreferenceProfile
}

// ============================================================================
// 데이터베이스 타입 확장
// ============================================================================

/**
 * preference_learning_events 테이블 타입 (기존 데이터베이스 타입 확장)
 */
export interface PreferenceLearningEventRow {
  id: string
  user_id: string | null
  event_type: UserBehaviorEventType
  target_type: EventTargetType
  target_id: string
  metadata: UserBehaviorEventMetadata | null
  created_at: string | null
}

/**
 * user_preferences 테이블 확장 필드
 */
export interface UserPreferencesExtension {
  learned_category_preferences: CategoryPreferences | null
  learned_price_preferences: PriceRangePreferences | null
  learned_region_preferences: RegionPreferences | null
  learned_tag_preferences: TagPreferences | null
  search_patterns: string[] | null
  confidence_score: number
  learning_enabled: boolean
}