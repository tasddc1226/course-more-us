/**
 * 선호도 학습 시스템 상수 정의
 * 
 * 선호도 학습 시스템에서 사용되는 상수값들을 정의합니다.
 */

// ============================================================================
// 점수 및 가중치 상수
// ============================================================================

/**
 * 개인화 가중치 최대값
 */
export const PERSONALIZATION_WEIGHTS = {
  /** 카테고리 부스트 최대 점수 */
  MAX_CATEGORY_BOOST: 20,
  /** 가격대 부스트 최대 점수 */
  MAX_PRICE_RANGE_BOOST: 15,
  /** 지역 부스트 최대 점수 */
  MAX_REGION_BOOST: 10,
  /** 태그 부스트 최대 점수 */
  MAX_TAG_BOOST: 10
} as const

/**
 * 선호도 점수 범위
 */
export const PREFERENCE_SCORE = {
  /** 최소 선호도 점수 */
  MIN: -1,
  /** 최대 선호도 점수 */
  MAX: 1,
  /** 중립 점수 */
  NEUTRAL: 0,
  /** 기본 증가량 */
  DEFAULT_INCREMENT: 0.1,
  /** 기본 감소량 */
  DEFAULT_DECREMENT: -0.1
} as const

/**
 * 신뢰도 점수 범위
 */
export const CONFIDENCE_SCORE = {
  /** 최소 신뢰도 */
  MIN: 0,
  /** 최대 신뢰도 */
  MAX: 1,
  /** 높은 신뢰도 임계값 */
  HIGH_THRESHOLD: 0.7,
  /** 중간 신뢰도 임계값 */
  MEDIUM_THRESHOLD: 0.4,
  /** 낮은 신뢰도 임계값 */
  LOW_THRESHOLD: 0.2
} as const

// ============================================================================
// 이벤트 관련 상수
// ============================================================================

/**
 * 이벤트 타입별 가중치
 */
export const EVENT_WEIGHTS = {
  /** 클릭 이벤트 가중치 */
  CLICK: 1.0,
  /** 조회 이벤트 가중치 */
  VIEW: 0.5,
  /** 체류 이벤트 가중치 */
  DWELL: 0.8,
  /** 검색 이벤트 가중치 */
  SEARCH: 0.6,
  /** 피드백 이벤트 가중치 */
  FEEDBACK: 2.0
} as const

/**
 * 체류 시간 임계값 (밀리초)
 */
export const DWELL_TIME = {
  /** 최소 의미있는 체류 시간 */
  MIN_MEANINGFUL: 3000, // 3초
  /** 관심 표시 임계값 */
  INTEREST_THRESHOLD: 10000, // 10초
  /** 높은 관심 임계값 */
  HIGH_INTEREST_THRESHOLD: 30000, // 30초
  /** 최대 추적 시간 */
  MAX_TRACKING: 300000 // 5분
} as const

/**
 * 피드백 점수 조정값
 */
export const FEEDBACK_ADJUSTMENTS = {
  /** 좋아요 피드백 점수 증가 */
  LIKE: 0.3,
  /** 싫어요 피드백 점수 감소 */
  DISLIKE: -0.2,
  /** 강한 좋아요 (여러 번 클릭) */
  STRONG_LIKE: 0.5,
  /** 강한 싫어요 */
  STRONG_DISLIKE: -0.4
} as const

// ============================================================================
// 데이터 관리 상수
// ============================================================================

/**
 * 학습 데이터 요구사항
 */
export const LEARNING_REQUIREMENTS = {
  /** 분석에 필요한 최소 이벤트 수 */
  MIN_EVENTS_FOR_ANALYSIS: 10,
  /** 신뢰할 수 있는 분석을 위한 권장 이벤트 수 */
  RECOMMENDED_EVENTS: 50,
  /** 높은 품질 분석을 위한 이벤트 수 */
  HIGH_QUALITY_EVENTS: 100,
  /** 카테고리별 최소 이벤트 수 */
  MIN_EVENTS_PER_CATEGORY: 3
} as const

/**
 * 데이터 보존 정책
 */
export const DATA_RETENTION = {
  /** 이벤트 데이터 보존 기간 (일) */
  EVENT_RETENTION_DAYS: 90,
  /** 선호도 데이터 보존 기간 (일) */
  PREFERENCE_RETENTION_DAYS: 365,
  /** 비활성 사용자 데이터 정리 기간 (일) */
  INACTIVE_USER_CLEANUP_DAYS: 180,
  /** 가중치 감소 시작 기간 (일) */
  WEIGHT_DECAY_START_DAYS: 30
} as const

/**
 * 가중치 감소 설정
 */
export const WEIGHT_DECAY = {
  /** 일일 감소율 */
  DAILY_DECAY_RATE: 0.01, // 1% per day
  /** 최소 가중치 */
  MIN_WEIGHT: 0.1,
  /** 감소 적용 임계값 */
  DECAY_THRESHOLD: 0.05
} as const

// ============================================================================
// 캐시 설정
// ============================================================================

/**
 * 캐시 TTL 설정 (초)
 */
export const CACHE_TTL = {
  /** 사용자 선호도 프로필 캐시 */
  USER_PROFILE: 3600, // 1시간
  /** 개인화 추천 결과 캐시 */
  PERSONALIZED_RECOMMENDATIONS: 1800, // 30분
  /** 사용자 통계 캐시 */
  USER_STATS: 7200, // 2시간
  /** 시스템 통계 캐시 */
  SYSTEM_STATS: 14400 // 4시간
} as const

/**
 * 캐시 키 패턴
 */
export const CACHE_KEYS = {
  /** 사용자 프로필 키 패턴 */
  USER_PROFILE: (userId: string) => `preference:profile:${userId}`,
  /** 개인화 추천 키 패턴 */
  PERSONALIZED_REC: (userId: string, regionId: number, timeSlots: string) => 
    `preference:rec:${userId}:${regionId}:${timeSlots}`,
  /** 사용자 통계 키 패턴 */
  USER_STATS: (userId: string) => `preference:stats:${userId}`,
  /** 시스템 통계 키 */
  SYSTEM_STATS: 'preference:system:stats'
} as const

// ============================================================================
// API 설정
// ============================================================================

/**
 * API 제한 설정
 */
export const API_LIMITS = {
  /** 배치 이벤트 최대 개수 */
  MAX_BATCH_EVENTS: 100,
  /** 단일 요청 최대 이벤트 수 */
  MAX_EVENTS_PER_REQUEST: 50,
  /** 사용자당 일일 이벤트 제한 */
  MAX_EVENTS_PER_USER_PER_DAY: 1000,
  /** 선호도 조정 최대 개수 */
  MAX_PREFERENCE_ADJUSTMENTS: 20
} as const

/**
 * 요청 타임아웃 설정 (밀리초)
 */
export const TIMEOUTS = {
  /** 이벤트 저장 타임아웃 */
  EVENT_SAVE: 5000,
  /** 선호도 분석 타임아웃 */
  PREFERENCE_ANALYSIS: 30000,
  /** 개인화 추천 타임아웃 */
  PERSONALIZED_RECOMMENDATION: 10000,
  /** 데이터베이스 쿼리 타임아웃 */
  DATABASE_QUERY: 15000
} as const

// ============================================================================
// 개인정보 보호 설정
// ============================================================================

/**
 * 개인정보 보호 설정
 */
export const PRIVACY_SETTINGS = {
  /** 익명화 처리 여부 */
  ANONYMIZE_DATA: true,
  /** 개인식별정보 제외 필드 */
  EXCLUDED_FIELDS: ['email', 'phone', 'real_name', 'address'],
  /** 데이터 암호화 여부 */
  ENCRYPT_SENSITIVE_DATA: true,
  /** 사용자 동의 필수 여부 */
  REQUIRE_USER_CONSENT: true
} as const

/**
 * 기본 설정값
 */
export const DEFAULT_SETTINGS = {
  /** 학습 기능 기본 활성화 여부 */
  LEARNING_ENABLED: true,
  /** 개인화 추천 기본 활성화 여부 */
  PERSONALIZATION_ENABLED: true,
  /** 피드백 수집 기본 활성화 여부 */
  FEEDBACK_COLLECTION_ENABLED: true,
  /** 분석 주기 (시간) */
  ANALYSIS_INTERVAL_HOURS: 24
} as const

// ============================================================================
// 에러 메시지
// ============================================================================

/**
 * 기본 에러 메시지
 */
export const ERROR_MESSAGES = {
  INSUFFICIENT_DATA: '선호도 분석에 필요한 데이터가 부족합니다.',
  ANALYSIS_FAILED: '선호도 분석 중 오류가 발생했습니다.',
  UPDATE_FAILED: '선호도 업데이트에 실패했습니다.',
  PRIVACY_VIOLATION: '개인정보 보호 정책에 위반됩니다.',
  INVALID_EVENT: '유효하지 않은 이벤트 데이터입니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  LEARNING_DISABLED: '선호도 학습이 비활성화되어 있습니다.',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다.',
  VALIDATION_ERROR: '데이터 유효성 검사에 실패했습니다.'
} as const

// ============================================================================
// 성능 모니터링 설정
// ============================================================================

/**
 * 성능 임계값
 */
export const PERFORMANCE_THRESHOLDS = {
  /** 이벤트 처리 최대 시간 (밀리초) */
  MAX_EVENT_PROCESSING_TIME: 1000,
  /** 선호도 분석 최대 시간 (밀리초) */
  MAX_ANALYSIS_TIME: 5000,
  /** 개인화 추천 최대 시간 (밀리초) */
  MAX_PERSONALIZATION_TIME: 2000,
  /** 메모리 사용량 경고 임계값 (MB) */
  MEMORY_WARNING_THRESHOLD: 100
} as const

/**
 * 배치 처리 설정
 */
export const BATCH_PROCESSING = {
  /** 배치 크기 */
  BATCH_SIZE: 50,
  /** 배치 처리 간격 (밀리초) */
  BATCH_INTERVAL: 5000,
  /** 최대 대기 시간 (밀리초) */
  MAX_WAIT_TIME: 30000,
  /** 재시도 횟수 */
  MAX_RETRIES: 3
} as const