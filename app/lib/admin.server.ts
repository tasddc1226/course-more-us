import { requireAuth } from './auth.server'
import { redirect } from "@remix-run/node"
import type { Database } from '~/types/database.types'
import { supabaseAdmin } from './supabase.server'

type PlaceInsert = Database['public']['Tables']['places']['Insert']
type PlaceUpdate = Database['public']['Tables']['places']['Update']

// 관리자 권한 확인
export async function requireAdmin(request: Request) {
  const { user, response } = await requireAuth(request)
  if (!user) throw response
  
  // 사용자 역할 확인
  const { data: userRole, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (roleError || !userRole || userRole.role !== 'admin') {
    throw redirect("/?error=unauthorized")
  }
  
  return { user }
}

// 관리자 권한 확인 (boolean 반환)
export async function isAdmin(request: Request): Promise<boolean> {
  try {
    const { user, response } = await requireAuth(request)
    if (!user) return false
    
    // 사용자 역할 확인
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    return !roleError && userRole && userRole.role === 'admin'
  } catch (error) {
    return false
  }
}

// 모든 장소 조회 (관리자용 - 비활성 장소도 포함)
export async function getAllPlaces(request: Request) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      regions(name),
      categories(name, icon)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 장소 상세 조회
export async function getPlaceById(request: Request, id: number) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      regions(id, name),
      categories(id, name),
      place_time_slots(time_slot_id, priority, time_slots(id, name))
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// 장소 생성
export async function createPlace(request: Request, placeData: PlaceInsert) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('places')
    .insert(placeData)
    .select()
    .single()

  if (error) throw error
  return data
}

// 장소 업데이트
export async function updatePlace(request: Request, id: number, placeData: PlaceUpdate) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('places')
    .update(placeData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 장소 삭제
export async function deletePlace(request: Request, id: number) {
  const { supabase } = await requireAdmin(request)
  
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 지역 목록 조회
export async function getRegions(request: Request) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

// 카테고리 목록 조회
export async function getCategories(request: Request) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

// 시간대 목록 조회
export async function getTimeSlots(request: Request) {
  const { supabase } = await requireAdmin(request)
  
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .order('start_time')

  if (error) throw error
  return data
}

// 장소-시간대 연결 관리
export async function updatePlaceTimeSlots(
  request: Request, 
  placeId: number, 
  timeSlotIds: Array<{ time_slot_id: number; priority: number }>
) {
  const { supabase } = await requireAdmin(request)
  
  // 기존 연결 삭제
  await supabase
    .from('place_time_slots')
    .delete()
    .eq('place_id', placeId)

  // 새로운 연결 추가
  if (timeSlotIds.length > 0) {
    const { error } = await supabase
      .from('place_time_slots')
      .insert(
        timeSlotIds.map(({ time_slot_id, priority }) => ({
          place_id: placeId,
          time_slot_id,
          priority
        }))
      )

    if (error) throw error
  }
}

// 내부 전용 타입 (관리자 페이지 전용)
type AdminUserSummary = {
  id: string
  email: string
  created_at: string | null
  last_sign_in_at: string | null
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
  role: 'admin' | 'user'
  placesCount: number
  nickname: string | null
}

// ===== 유저 관리 함수들 =====

// 모든 유저 조회 (관리자용)
export async function getAllUsers(request: Request) {
  await requireAdmin(request)

  // 1) Auth 테이블의 모든 사용자 가져오기 (서비스 역할 키 사용)
  const { data: listResponse, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) throw listError
  const authUsers = listResponse?.users ?? []

  // 2) user_roles 테이블에서 역할 정보 가져오기
  const { data: roleRows, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, role')

  if (roleError) throw roleError
  const roleMap = new Map(
    (roleRows as Array<{ user_id: string; role: string | null }>).map((r) => [r.user_id, (r.role ?? 'user') as 'admin' | 'user'])
  )

  // 2-1) user_profiles 테이블에서 프로필 정보 가져오기
  const { data: profileRows, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, nickname')

  if (profileError) throw profileError
  const profileMap = new Map(
    (profileRows as Array<{ id: string; nickname: string | null }>).map((p) => [p.id, p.nickname])
  )

  // 3) 각 유저별 등록한 장소 수 집계
  const userPlaceCounts = new Map<string, number>()
  
  // 유저별 장소 개수 집계
  for (const user of authUsers) {
    const { count, error: countError } = await supabaseAdmin
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source', 'user')
    
    if (!countError && count !== null) {
      userPlaceCounts.set(user.id, count)
    } else {
      userPlaceCounts.set(user.id, 0)
    }
  }

  // 4) Auth 사용자 정보와 역할, 장소 수를 병합
  const users: AdminUserSummary[] = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    user_metadata: u.user_metadata ?? {},
    app_metadata: u.app_metadata ?? {},
    role: roleMap.get(u.id) ?? 'user',
    placesCount: userPlaceCounts.get(u.id) ?? 0,
    nickname: profileMap.get(u.id) ?? null,
  }))

  // 관리 편의상 최근 가입 순으로 정렬
  users.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

  return users
}

// 사용자 역할 업데이트
export async function updateUserRole(request: Request, userId: string, newRole: 'admin' | 'user') {
  await requireAdmin(request)
  
  // service role을 사용하여 RLS 우회
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role: newRole 
    }, {
      onConflict: 'user_id'
    })
    .select()

  if (error) throw error
  return data?.[0] || { user_id: userId, role: newRole }
}

// 사용자 삭제 (소프트 삭제 - 실제로는 비활성화)
export async function deleteUser(request: Request, userId: string) {
  await requireAdmin(request)

  // Supabase Auth에서 사용자 삭제 (서비스 역할 키 사용)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) throw error

  // user_roles에서도 제거
  await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
}

// 사용자 통계 조회
export async function getUserStats(request: Request) {
  await requireAdmin(request)

  // 전체 사용자 수
  const { data: listResponse, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) throw listError
  const totalUsers = listResponse?.users?.length ?? 0

  // 역할 통계
  const { data: roleRows, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
  if (roleError) throw roleError

  const adminUsers = (roleRows as Array<{ role: string | null }>).filter((r) => r.role === 'admin').length
  const regularUsers = totalUsers - adminUsers

  return {
    totalUsers,
    adminUsers,
    regularUsers,
  }
}

// 탈퇴 사유 통계 조회
export async function getAccountDeletionStats(request: Request) {
  await requireAdmin(request)

  // 탈퇴 사유별 집계 (user_feedback 테이블의 account_deletion 타이틀)
  const { data: deletionReasons, error } = await supabaseAdmin
    .from('user_feedback')
    .select('content')
    .eq('title', 'account_deletion')

  if (error) throw error

  // 사유별 카운트 집계
  const reasonCounts = new Map<string, number>()
  let totalDeletions = 0

  for (const feedback of deletionReasons || []) {
    const reason = feedback.content?.trim() || '사유 없음'
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    totalDeletions++
  }

  // Map을 배열로 변환하고 카운트 순으로 정렬
  const reasonStats = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalDeletions > 0 ? Math.round((count / totalDeletions) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalDeletions,
    reasonStats
  }
} 