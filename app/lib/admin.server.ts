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