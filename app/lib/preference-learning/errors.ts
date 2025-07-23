/**
 * 선호도 학습 시스템 에러 클래스
 * 
 * 선호도 학습 과정에서 발생할 수 있는 다양한 에러 상황을 처리합니다.
 */

/**
 * 선호도 학습 에러 코드
 */
export type PreferenceLearningErrorCode = 
  | 'INSUFFICIENT_DATA'
  | 'ANALYSIS_FAILED'
  | 'UPDATE_FAILED'
  | 'PRIVACY_VIOLATION'
  | 'INVALID_EVENT'
  | 'USER_NOT_FOUND'
  | 'LEARNING_DISABLED'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'

/**
 * 선호도 학습 기본 에러 클래스
 */
export class PreferenceLearningError extends Error {
  public readonly code: PreferenceLearningErrorCode
  public readonly userId?: string
  public readonly timestamp: Date
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: PreferenceLearningErrorCode,
    userId?: string,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'PreferenceLearningError'
    this.code = code
    this.userId = userId
    this.timestamp = new Date()
    this.context = context

    // Error 클래스 상속 시 필요한 설정
    Object.setPrototypeOf(this, PreferenceLearningError.prototype)
  }

  /**
   * 에러 정보를 JSON 형태로 직렬화
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      userId: this.userId,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    }
  }

  /**
   * 로깅용 문자열 표현
   */
  toString(): string {
    const userInfo = this.userId ? ` [User: ${this.userId}]` : ''
    const contextInfo = this.context ? ` [Context: ${JSON.stringify(this.context)}]` : ''
    return `${this.name} [${this.code}]${userInfo}: ${this.message}${contextInfo}`
  }
}

/**
 * 데이터 부족 에러
 * 선호도 분석에 필요한 최소한의 데이터가 없을 때 발생
 */
export class InsufficientDataError extends PreferenceLearningError {
  constructor(userId: string, requiredEvents: number, actualEvents: number) {
    super(
      `선호도 분석에 필요한 최소 이벤트 수(${requiredEvents}개)가 부족합니다. 현재: ${actualEvents}개`,
      'INSUFFICIENT_DATA',
      userId,
      { requiredEvents, actualEvents }
    )
    this.name = 'InsufficientDataError'
  }
}

/**
 * 분석 실패 에러
 * 선호도 분석 과정에서 오류가 발생했을 때
 */
export class AnalysisFailedError extends PreferenceLearningError {
  constructor(userId: string, reason: string, originalError?: Error) {
    super(
      `선호도 분석 중 오류가 발생했습니다: ${reason}`,
      'ANALYSIS_FAILED',
      userId,
      { reason, originalError: originalError?.message }
    )
    this.name = 'AnalysisFailedError'
  }
}

/**
 * 업데이트 실패 에러
 * 선호도 데이터 업데이트 중 오류가 발생했을 때
 */
export class UpdateFailedError extends PreferenceLearningError {
  constructor(userId: string, operation: string, originalError?: Error) {
    super(
      `선호도 데이터 업데이트 실패: ${operation}`,
      'UPDATE_FAILED',
      userId,
      { operation, originalError: originalError?.message }
    )
    this.name = 'UpdateFailedError'
  }
}

/**
 * 개인정보 보호 위반 에러
 * 사용자가 학습을 비활성화했거나 개인정보 보호 정책에 위반되는 경우
 */
export class PrivacyViolationError extends PreferenceLearningError {
  constructor(userId: string, reason: string) {
    super(
      `개인정보 보호 정책 위반: ${reason}`,
      'PRIVACY_VIOLATION',
      userId,
      { reason }
    )
    this.name = 'PrivacyViolationError'
  }
}

/**
 * 잘못된 이벤트 에러
 * 이벤트 데이터가 유효하지 않을 때
 */
export class InvalidEventError extends PreferenceLearningError {
  constructor(userId: string, eventData: any, validationErrors: string[]) {
    super(
      `잘못된 이벤트 데이터: ${validationErrors.join(', ')}`,
      'INVALID_EVENT',
      userId,
      { eventData, validationErrors }
    )
    this.name = 'InvalidEventError'
  }
}

/**
 * 사용자 없음 에러
 * 존재하지 않는 사용자에 대한 작업을 시도할 때
 */
export class UserNotFoundError extends PreferenceLearningError {
  constructor(userId: string) {
    super(
      `사용자를 찾을 수 없습니다: ${userId}`,
      'USER_NOT_FOUND',
      userId
    )
    this.name = 'UserNotFoundError'
  }
}

/**
 * 학습 비활성화 에러
 * 사용자가 선호도 학습을 비활성화한 상태에서 학습 관련 작업을 시도할 때
 */
export class LearningDisabledError extends PreferenceLearningError {
  constructor(userId: string) {
    super(
      `사용자가 선호도 학습을 비활성화했습니다`,
      'LEARNING_DISABLED',
      userId
    )
    this.name = 'LearningDisabledError'
  }
}

/**
 * 데이터베이스 에러
 * 데이터베이스 작업 중 오류가 발생했을 때
 */
export class DatabaseError extends PreferenceLearningError {
  constructor(operation: string, originalError: Error, userId?: string) {
    super(
      `데이터베이스 작업 실패: ${operation}`,
      'DATABASE_ERROR',
      userId,
      { operation, originalError: originalError.message }
    )
    this.name = 'DatabaseError'
  }
}

/**
 * 유효성 검사 에러
 * 입력 데이터의 유효성 검사에 실패했을 때
 */
export class ValidationError extends PreferenceLearningError {
  constructor(field: string, value: any, rule: string, userId?: string) {
    super(
      `유효성 검사 실패: ${field} - ${rule}`,
      'VALIDATION_ERROR',
      userId,
      { field, value, rule }
    )
    this.name = 'ValidationError'
  }
}

/**
 * 에러 팩토리 함수들
 */
export const PreferenceLearningErrors = {
  /**
   * 데이터 부족 에러 생성
   */
  insufficientData: (userId: string, requiredEvents: number, actualEvents: number) =>
    new InsufficientDataError(userId, requiredEvents, actualEvents),

  /**
   * 분석 실패 에러 생성
   */
  analysisFailed: (userId: string, reason: string, originalError?: Error) =>
    new AnalysisFailedError(userId, reason, originalError),

  /**
   * 업데이트 실패 에러 생성
   */
  updateFailed: (userId: string, operation: string, originalError?: Error) =>
    new UpdateFailedError(userId, operation, originalError),

  /**
   * 개인정보 보호 위반 에러 생성
   */
  privacyViolation: (userId: string, reason: string) =>
    new PrivacyViolationError(userId, reason),

  /**
   * 잘못된 이벤트 에러 생성
   */
  invalidEvent: (userId: string, eventData: any, validationErrors: string[]) =>
    new InvalidEventError(userId, eventData, validationErrors),

  /**
   * 사용자 없음 에러 생성
   */
  userNotFound: (userId: string) =>
    new UserNotFoundError(userId),

  /**
   * 학습 비활성화 에러 생성
   */
  learningDisabled: (userId: string) =>
    new LearningDisabledError(userId),

  /**
   * 데이터베이스 에러 생성
   */
  database: (operation: string, originalError: Error, userId?: string) =>
    new DatabaseError(operation, originalError, userId),

  /**
   * 유효성 검사 에러 생성
   */
  validation: (field: string, value: any, rule: string, userId?: string) =>
    new ValidationError(field, value, rule, userId)
}

/**
 * 에러 핸들링 유틸리티
 */
export class PreferenceLearningErrorHandler {
  /**
   * 에러가 선호도 학습 관련 에러인지 확인
   */
  static isPreferenceLearningError(error: any): error is PreferenceLearningError {
    return error instanceof PreferenceLearningError
  }

  /**
   * 에러 코드별 기본 처리 전략 반환
   */
  static getDefaultStrategy(error: PreferenceLearningError): 'retry' | 'fallback' | 'abort' | 'ignore' {
    switch (error.code) {
      case 'INSUFFICIENT_DATA':
        return 'fallback' // 기본 추천 사용
      case 'ANALYSIS_FAILED':
        return 'retry' // 재시도 후 fallback
      case 'UPDATE_FAILED':
        return 'retry' // 재시도
      case 'PRIVACY_VIOLATION':
        return 'abort' // 작업 중단
      case 'INVALID_EVENT':
        return 'ignore' // 해당 이벤트 무시
      case 'USER_NOT_FOUND':
        return 'abort' // 작업 중단
      case 'LEARNING_DISABLED':
        return 'fallback' // 기본 추천 사용
      case 'DATABASE_ERROR':
        return 'retry' // 재시도
      case 'VALIDATION_ERROR':
        return 'ignore' // 해당 데이터 무시
      default:
        return 'fallback'
    }
  }

  /**
   * 에러를 로그에 기록할지 여부 결정
   */
  static shouldLog(error: PreferenceLearningError): boolean {
    // 개인정보 보호나 학습 비활성화는 정상적인 상황이므로 로그하지 않음
    return !['PRIVACY_VIOLATION', 'LEARNING_DISABLED'].includes(error.code)
  }

  /**
   * 사용자에게 표시할 에러 메시지 생성
   */
  static getUserMessage(error: PreferenceLearningError): string {
    switch (error.code) {
      case 'INSUFFICIENT_DATA':
        return '더 많은 사용 데이터가 쌓이면 개인화된 추천을 제공해드릴게요.'
      case 'ANALYSIS_FAILED':
      case 'UPDATE_FAILED':
      case 'DATABASE_ERROR':
        return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 'PRIVACY_VIOLATION':
      case 'LEARNING_DISABLED':
        return '개인화 기능이 비활성화되어 기본 추천을 제공합니다.'
      case 'INVALID_EVENT':
      case 'VALIDATION_ERROR':
        return '요청 데이터에 문제가 있습니다. 다시 시도해주세요.'
      case 'USER_NOT_FOUND':
        return '사용자 정보를 찾을 수 없습니다. 로그인을 확인해주세요.'
      default:
        return '알 수 없는 오류가 발생했습니다.'
    }
  }
}