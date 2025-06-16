/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 강도 검증 (최소 8자, 대소문자, 숫자 포함)
 */
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * 휴대폰 번호 형식 검증 (한국 형식)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^010-?\d{4}-?\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * URL 형식 검증
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 필수 필드 검증
 */
export function isRequired(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * 문자열 길이 검증
 */
export function hasValidLength(value: string, min: number, max?: number): boolean {
  const length = value.trim().length;
  if (max) {
    return length >= min && length <= max;
  }
  return length >= min;
}

/**
 * 숫자 범위 검증
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
} 