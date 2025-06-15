import { requireAuth } from './auth.server'
import { redirect } from "@remix-run/node"
import type { Database } from '~/types/database.types'

type PlaceInsert = Database['public']['Tables']['places']['Insert']
type PlaceUpdate = Database['public']['Tables']['places']['Update']

// 관리자 권한 확인
export async function requireAdmin(request: Request) {
  const { user, supabase } = await requireAuth(request)
  
  // 사용자 역할 확인
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (roleError || !userRole || userRole.role !== 'admin') {
    throw redirect("/?error=unauthorized")
  }
  
  return { user, supabase }
}

// 관리자 권한 확인 (boolean 반환)
export async function isAdmin(request: Request): Promise<boolean> {
  try {
    const { user, supabase } = await requireAuth(request)
    
    // 사용자 역할 확인
    const { data: userRole, error: roleError } = await supabase
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

// ===== 유저 관리 함수들 =====

// 모든 유저 조회 (관리자용) - 간소화된 버전
export async function getAllUsers(request: Request) {
  const { supabase, user: currentUser } = await requireAdmin(request)
  
  // user_roles 테이블에서 사용자 역할 정보 조회
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // 간소화된 사용자 정보 반환 (현재 사용자 정보는 실제 정보 표시)
  const users = data.map((userRole) => {
    const isCurrentUser = userRole.user_id === currentUser.id
    
    return {
      id: userRole.user_id,
      role: userRole.role,
      email: isCurrentUser ? currentUser.email || 'Unknown' : `user-${userRole.user_id.slice(0, 8)}@example.com`,
      created_at: userRole.created_at,
      last_sign_in_at: isCurrentUser ? currentUser.last_sign_in_at : null,
      user_metadata: isCurrentUser ? currentUser.user_metadata || {} : { name: `사용자 ${userRole.user_id.slice(0, 8)}` },
      app_metadata: isCurrentUser ? currentUser.app_metadata || {} : { providers: ['email'] },
      role_updated_at: userRole.updated_at
    }
  })

  return users
}

// 사용자 역할 업데이트
export async function updateUserRole(request: Request, userId: string, newRole: 'admin' | 'user') {
  const { supabase } = await requireAdmin(request)
  
  // upsert를 사용하여 존재하지 않으면 생성, 존재하면 업데이트
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role: newRole 
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 사용자 삭제 (소프트 삭제 - 실제로는 비활성화)
export async function deleteUser(request: Request, userId: string) {
  const { supabase } = await requireAdmin(request)
  
  // Supabase Auth에서 사용자 삭제
  const { error } = await supabase.auth.admin.deleteUser(userId)
  
  if (error) throw error
  
  // user_roles에서도 제거
  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
}

// 사용자 통계 조회
export async function getUserStats(request: Request) {
  const { supabase } = await requireAdmin(request)
  
  const { data: roleStats, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
  
  if (roleError) throw roleError
  
  const totalUsers = roleStats.length
  const adminUsers = roleStats.filter(u => u.role === 'admin').length
  const regularUsers = roleStats.filter(u => u.role === 'user').length
  
  return {
    totalUsers,
    adminUsers,
    regularUsers
  }
} 