// 서버 사이드 메모리 캐시 시스템
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30분

/**
 * 캐시에서 데이터 조회
 */
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  // TTL 체크
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

/**
 * 캐시에 데이터 저장
 */
export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * 특정 키의 캐시 무효화
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * 전체 캐시 무효화
 */
export function clearAllCache(): void {
  cache.clear()
}

// 특정 도메인별 캐시 무효화 함수들
export function invalidateRegionsCache(): void {
  invalidateCache('regions')
}

export function invalidateTimeSlotsCache(): void {
  invalidateCache('time_slots')
}