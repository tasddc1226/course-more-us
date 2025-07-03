 import { createSupabaseServerClient, supabaseAdmin } from './supabase.server'
import { getCachedData, setCachedData, invalidateRegionsCache } from './cache.server'

// 모든 지역 조회 (사용자용) - 캐싱 적용
export async function getRegions(request: Request) {
  const cacheKey = 'regions'
  const cached = getCachedData(cacheKey)
  
  if (cached) {
    return cached
  }

  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name')

  if (error) throw error
  
  setCachedData(cacheKey, data)
  return data
}

// 모든 시간대 조회 (사용자용) - 캐싱 적용  
export async function getTimeSlots(request: Request) {
  const cacheKey = 'time_slots'
  const cached = getCachedData(cacheKey)
  
  if (cached) {
    return cached
  }

  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .order('start_time')

  if (error) throw error
  
  setCachedData(cacheKey, data)
  return data
}

// 모든 카테고리 조회 (사용자용)
export async function getCategories(request: Request) {
  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

// 지역명으로 지역 찾기 또는 생성
export async function findOrCreateRegion(request: Request, regionName: string) {
  console.log(`findOrCreateRegion 시작: ${regionName}`)
  const supabase = createSupabaseServerClient(request)
  
  // 먼저 기존 지역 찾기
  console.log('기존 지역 검색 중...')
  const { data: existingRegion, error: findError } = await supabase
    .from('regions')
    .select('*')
    .eq('name', regionName)
    .single()

  if (findError && findError.code !== 'PGRST116') { // PGRST116은 "not found" 에러
    console.error('지역 검색 오류:', findError)
    throw findError
  }

  // 기존 지역이 있으면 반환
  if (existingRegion) {
    console.log('기존 지역 발견:', existingRegion)
    return existingRegion
  }

  console.log('새 지역 생성 필요...')

  // slug 생성 (한글을 영문으로 변환하거나 단순화)
  const slug = regionName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')

  console.log(`생성할 지역 데이터: name=${regionName}, slug=${slug}`)

  // 새 지역 생성 (service role 사용하여 RLS 우회)
  const { data: newRegion, error: createError } = await supabaseAdmin
    .from('regions')
    .insert({
      name: regionName,
      slug: slug,
      description: `사용자가 추가한 지역: ${regionName}`
    })
    .select()
    .single()

  if (createError) {
    console.error('지역 생성 오류:', createError)
    throw createError
  }

  console.log('새 지역 생성 성공:', newRegion)
  
  // 새 지역이 추가되었으므로 캐시 무효화
  invalidateRegionsCache()
  
  return newRegion
} 