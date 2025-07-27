/**
 * 선호도 학습 시스템 기본 인터페이스
 * 
 * 선호도 학습 시스템의 핵심 인터페이스들을 정의합니다.
 */

import type {
  UserBehaviorEvent,
  UserPreferenceProfile,
  PreferenceProfileData,
  PreferenceAdjustmentRequest,
  UserLearningStats,
  PersonalizationWeights
} from '../../types/preference-learning'
import type { Place } from '../recommendation/types'

// ============================================================================
// 이벤트 수집 인터페이스
// ============================================================================

/**
 * 선호도 학습 이벤트 트래커 인터페이스
 */
export interface IPreferenceLearningTracker {
  /**
   * 일반적인 사용자 행동 이벤트 추적
   */
  trackEvent(event: UserBehaviorEvent): Promise<void>

  /**
   * 장소 조회 이벤트 추적
   */
  trackPlaceView(userId: string, placeId: string, dwellTime: number): Promise<void>

  /**
   * 장소 클릭 이벤트 추적
   */
  trackPlaceClick(userId: string, placeId: string, context?: Record<string, any>): Promise<void>

  /**
   * 검색 쿼리 이벤트 추적
   */
  trackSearchQuery(userId: string, query: string, results: Place[]): Promise<void>

  /**
   * 추천 피드백 이벤트 추적
   */
  trackRecommendationFeedback(
    userId: string, 
    placeId: string, 
    feedback: 'like' | 'dislike',
    recommendationSessionId?: string
  ): Promise<void>

  /**
   * 배치로 여러 이벤트 추적
   */
  trackEvents(events: UserBehaviorEvent[]): Promise<void>
}

// ============================================================================
// 선호도 분석 인터페이스
// ============================================================================

/**
 * 선호도 분석기 인터페이스
 */
export interface IPreferenceAnalyzer {
  /**
   * 사용자 이벤트를 분석하여 선호도 프로필 생성
   */
  analyzeUserEvents(userId: string): Promise<UserPreferenceProfile>

  /**
   * 피드백을 기반으로 선호도 업데이트
   */
  updatePreferencesFromFeedback(
    userId: string, 
    placeId: string, 
    feedback: 'like' | 'dislike'
  ): Promise<void>

  /**
   * 이벤트 데이터로부터 선호도 점수 계산
   */
  calculatePreferenceScores(userId: string, events: UserBehaviorEvent[]): Promise<UserPreferenceProfile>

  /**
   * 오래된 선호도 데이터의 가중치 감소
   */
  decayOldPreferences(userId: string): Promise<void>

  /**
   * 사용자의 학습 데이터 품질 평가
   */
  evaluateLearningQuality(userId: string): Promise<number>
}

// ============================================================================
// 개인화 추천 인터페이스
// ============================================================================

/**
 * 개인화 추천 엔진 인터페이스
 */
export interface IPersonalizedRecommendationEngine {
  /**
   * 기존 장소 점수에 개인화 가중치 적용
   */
  applyPersonalization(
    places: Array<{ place: Place; score: number }>, 
    userPreferences: UserPreferenceProfile
  ): Promise<Array<{ place: Place; score: number; personalizationWeights: PersonalizationWeights }>>

  /**
   * 특정 장소에 대한 개인화 점수 계산
   */
  calculatePersonalizationScore(
    place: Place, 
    preferences: UserPreferenceProfile
  ): Promise<PersonalizationWeights>

  /**
   * 사용자 선호도가 반영된 개인화 추천 제공
   */
  getPersonalizedRecommendations(
    userId: string,
    baseRecommendations: Place[]
  ): Promise<Place[]>

  /**
   * 개인화 효과 측정
   */
  measurePersonalizationEffect(
    userId: string,
    personalizedResults: Place[],
    baselineResults: Place[]
  ): Promise<{
    diversityImprovement: number
    relevanceImprovement: number
    noveltyScore: number
  }>
}

// ============================================================================
// 선호도 프로필 관리 인터페이스
// ============================================================================

/**
 * 선호도 프로필 관리자 인터페이스
 */
export interface IPreferenceProfileManager {
  /**
   * 사용자 선호도 프로필 조회
   */
  getUserProfile(userId: string): Promise<PreferenceProfileData>

  /**
   * 선호도 수동 조정
   */
  updatePreference(
    userId: string, 
    adjustments: PreferenceAdjustmentRequest[]
  ): Promise<UserPreferenceProfile>

  /**
   * 사용자 선호도 초기화
   */
  resetUserPreferences(userId: string): Promise<void>

  /**
   * 사용자 데이터 내보내기
   */
  exportUserData(userId: string): Promise<{
    profile: UserPreferenceProfile
    events: UserBehaviorEvent[]
    stats: UserLearningStats
  }>

  /**
   * 사용자 학습 데이터 삭제
   */
  deleteUserData(userId: string): Promise<void>

  /**
   * 학습 기능 활성화/비활성화
   */
  setLearningEnabled(userId: string, enabled: boolean): Promise<void>
}

// ============================================================================
// 데이터 저장소 인터페이스
// ============================================================================

/**
 * 선호도 학습 데이터 저장소 인터페이스
 */
export interface IPreferenceLearningRepository {
  /**
   * 이벤트 저장
   */
  saveEvent(event: UserBehaviorEvent): Promise<void>

  /**
   * 여러 이벤트 배치 저장
   */
  saveEvents(events: UserBehaviorEvent[]): Promise<void>

  /**
   * 사용자 이벤트 조회
   */
  getUserEvents(
    userId: string, 
    options?: {
      eventTypes?: string[]
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<UserBehaviorEvent[]>

  /**
   * 선호도 프로필 저장
   */
  saveUserProfile(profile: UserPreferenceProfile): Promise<void>

  /**
   * 선호도 프로필 조회
   */
  getUserProfile(userId: string): Promise<UserPreferenceProfile | null>

  /**
   * 사용자 학습 통계 저장
   */
  saveUserStats(stats: UserLearningStats): Promise<void>

  /**
   * 사용자 학습 통계 조회
   */
  getUserStats(userId: string): Promise<UserLearningStats | null>

  /**
   * 오래된 이벤트 정리
   */
  cleanupOldEvents(olderThanDays: number): Promise<number>

  /**
   * 사용자 데이터 완전 삭제
   */
  deleteAllUserData(userId: string): Promise<void>
}

// ============================================================================
// 캐시 인터페이스
// ============================================================================

/**
 * 선호도 학습 캐시 인터페이스
 */
export interface IPreferenceLearningCache {
  /**
   * 사용자 선호도 프로필 캐시 조회
   */
  getUserProfile(userId: string): Promise<UserPreferenceProfile | null>

  /**
   * 사용자 선호도 프로필 캐시 저장
   */
  setUserProfile(userId: string, profile: UserPreferenceProfile, ttl?: number): Promise<void>

  /**
   * 개인화 추천 결과 캐시 조회
   */
  getPersonalizedRecommendations(cacheKey: string): Promise<Place[] | null>

  /**
   * 개인화 추천 결과 캐시 저장
   */
  setPersonalizedRecommendations(cacheKey: string, recommendations: Place[], ttl?: number): Promise<void>

  /**
   * 사용자 관련 캐시 무효화
   */
  invalidateUserCache(userId: string): Promise<void>

  /**
   * 특정 키 패턴의 캐시 무효화
   */
  invalidatePattern(pattern: string): Promise<void>
}

// ============================================================================
// 유효성 검사 인터페이스
// ============================================================================

/**
 * 선호도 학습 데이터 유효성 검사 인터페이스
 */
export interface IPreferenceLearningValidator {
  /**
   * 사용자 행동 이벤트 유효성 검사
   */
  validateEvent(event: UserBehaviorEvent): Promise<{
    isValid: boolean
    errors: string[]
  }>

  /**
   * 선호도 조정 요청 유효성 검사
   */
  validatePreferenceAdjustment(adjustment: PreferenceAdjustmentRequest): Promise<{
    isValid: boolean
    errors: string[]
  }>

  /**
   * 사용자 ID 유효성 검사
   */
  validateUserId(userId: string): Promise<boolean>

  /**
   * 선호도 점수 범위 검사
   */
  validatePreferenceScore(score: number): boolean

  /**
   * 이벤트 메타데이터 유효성 검사
   */
  validateEventMetadata(metadata: any): Promise<{
    isValid: boolean
    errors: string[]
  }>
}

// ============================================================================
// 서비스 팩토리 인터페이스
// ============================================================================

/**
 * 선호도 학습 서비스 팩토리 인터페이스
 */
export interface IPreferenceLearningServiceFactory {
  /**
   * 이벤트 트래커 생성
   */
  createTracker(): IPreferenceLearningTracker

  /**
   * 선호도 분석기 생성
   */
  createAnalyzer(): IPreferenceAnalyzer

  /**
   * 개인화 추천 엔진 생성
   */
  createRecommendationEngine(): IPersonalizedRecommendationEngine

  /**
   * 프로필 관리자 생성
   */
  createProfileManager(): IPreferenceProfileManager

  /**
   * 데이터 저장소 생성
   */
  createRepository(): IPreferenceLearningRepository

  /**
   * 캐시 생성
   */
  createCache(): IPreferenceLearningCache

  /**
   * 유효성 검사기 생성
   */
  createValidator(): IPreferenceLearningValidator
}