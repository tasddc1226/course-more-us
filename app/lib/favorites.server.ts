import { createSupabaseServerClient } from './supabase.server'
import { getUser } from './auth.server'
import type { Tables, TablesInsert } from '~/types/database.types'

export type UserFavorite = Tables<'user_favorites'>

// 즐겨찾기 추가/제거 (토글 방식)
export async function toggleFavorite(
  request: Request,
  placeId: number
): Promise<{ success: boolean; action: 'created' | 'deleted'; isFavorite: boolean }> {
  const user = await getUser(request)
  if (!user) throw new Error('인증이 필요합니다')

  const supabase = createSupabaseServerClient(request)
  
  // 기존 즐겨찾기 확인
  const { data: existingFavorite, error: selectError } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', user.id)
    .eq('place_id', placeId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    throw selectError
  }

  if (existingFavorite) {
    // 기존 즐겨찾기가 있으면 삭제 (토글 off)
    const { error: deleteError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', existingFavorite.id)

    if (deleteError) throw deleteError
    return { success: true, action: 'deleted', isFavorite: false }
  } else {
    // 기존 즐겨찾기가 없으면 생성 (토글 on)
    const { error: insertError } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        place_id: placeId
      })

    if (insertError) throw insertError
    return { success: true, action: 'created', isFavorite: true }
  }
}

// 여러 장소에 대한 사용자 즐겨찾기 일괄 조회 (메인 페이지용)
export async function getUserFavoritesForPlaces(
  request: Request,
  placeIds: number[]
): Promise<Record<number, boolean>> {
  const user = await getUser(request)
  if (!user) return {}

  const supabase = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('user_favorites')
    .select('place_id')
    .eq('user_id', user.id)
    .in('place_id', placeIds)

  if (error) throw error
  
  // 장소 ID별로 즐겨찾기 여부 반환
  const favoritesByPlace: Record<number, boolean> = {}
  
  // 초기화
  placeIds.forEach(id => {
    favoritesByPlace[id] = false
  })
  
  // 즐겨찾기된 것들만 true로 설정
  if (data) {
    data.forEach(favorite => {
      favoritesByPlace[favorite.place_id] = true
    })
  }
  
  return favoritesByPlace
}

// 사용자의 모든 즐겨찾기 조회 (즐겨찾기 목록 페이지용)
export async function getUserFavorites(
  request: Request,
  offset = 0,
  limit = 20
): Promise<{
  favorites: Array<UserFavorite & {
    places: {
      id: number
      name: string
      description: string | null
      address: string
      latitude: number | null
      longitude: number | null
      rating: number | null
      price_range: number | null
      is_partnership: boolean | null
      categories: {
        name: string
        icon: string | null
      } | null
      place_images: Array<{
        image_url: string
        alt_text: string | null
      }> | null
      tags: string[] | null
    }
  }>
  total: number
}> {
  const user = await getUser(request)
  if (!user) throw new Error('인증이 필요합니다')

  const supabase = createSupabaseServerClient(request)
  
  // 총 개수 조회
  const { count, error: countError } = await supabase
    .from('user_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) throw countError

  // 즐겨찾기 목록 조회 (장소 정보 포함)
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      *,
      places!inner (
        id,
        name,
        description,
        address,
        latitude,
        longitude,
        rating,
        price_range,
        is_partnership,
        tags,
        categories (
          name,
          icon
        ),
        place_images (
          image_url,
          alt_text
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('places.is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  
  return {
    favorites: data || [],
    total: count || 0
  }
}

// 즐겨찾기 개수 조회
export async function getFavoritesCount(request: Request): Promise<number> {
  const user = await getUser(request)
  if (!user) return 0

  const supabase = createSupabaseServerClient(request)
  
  const { count, error } = await supabase
    .from('user_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) throw error
  
  return count || 0
}