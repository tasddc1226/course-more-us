import { createSupabaseServerClient } from "~/lib/supabase.server";
import { findOrCreateRegion } from "~/lib/recommendation.server";
import type { UserPlaceFormData } from "~/types/forms";
import { createClient } from "@supabase/supabase-js";

/**
 * 주소에서 지역명을 추출합니다
 */
export function extractRegionFromAddress(address: string): string {
  // 주소에서 시/구/군 단위 추출
  const regionPattern = /([가-힣]+시|[가-힣]+구|[가-힣]+군)/;
  const match = address.match(regionPattern);
  
  if (match) {
    return match[1];
  }
  
  // 패턴이 매치되지 않으면 첫 번째 단어 사용
  const parts = address.split(' ');
  return parts[0] || '기타';
}

/**
 * 유저의 오늘 등록한 장소 개수 확인
 */
export async function getTodayPlaceCount(request: Request): Promise<number> {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  const today = new Date().toISOString().split('T')[0];
  
  const { count, error } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source', 'user')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);

  if (error) {
    console.error('Error checking daily place count:', error);
    throw new Error("일일 등록 개수 확인 중 오류가 발생했습니다");
  }

  return count || 0;
}

/**
 * 유저 장소 등록 (지도에서 선택한 위치 기반)
 */
export async function createUserPlaceFromLocation(
  request: Request,
  placeData: {
    placeName: string;
    regionName: string;
    address: string;
    latitude: number;
    longitude: number;
    category_id: number;
    description: string;
    tags: string[];
    images: string[];
  }
) {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  // 하루 3개 제한 체크
  const todayCount = await getTodayPlaceCount(request);
  if (todayCount >= 3) {
    throw new Error("하루 최대 3개까지만 장소를 등록할 수 있습니다");
  }

  // 지역 찾기 또는 생성
  const region = await findOrCreateRegion(request, placeData.regionName);

  // 장소 등록
  const { data: place, error: placeError } = await supabase
    .from('places')
    .insert({
      name: placeData.placeName,
      address: placeData.address,
      description: placeData.description,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      tags: placeData.tags,
      category_id: placeData.category_id,
      region_id: region.id,
      user_id: user.id,
      source: 'user',
      is_active: true,
      rating: 0,
      price_range: 2
    })
    .select()
    .single();

  if (placeError) {
    console.error('Error creating user place:', placeError);
    throw new Error("장소 등록 중 오류가 발생했습니다");
  }

  // 이미지 등록
  if (placeData.images.length > 0) {
    const imageInserts = placeData.images.map((imageUrl, index) => ({
      place_id: place.id,
      image_url: imageUrl,
      display_order: index + 1,
      is_primary: index === 0
    }));

    const { error: imageError } = await supabase
      .from('place_images')
      .insert(imageInserts);

    if (imageError) {
      console.error('Error creating place images:', imageError);
      // 이미지 오류는 장소 등록을 실패시키지 않음
    }
  }

  return place;
}

/**
 * 유저 장소 등록 (기존 방식 - 호환성 유지)
 */
export async function createUserPlace(
  request: Request, 
  placeData: Omit<UserPlaceFormData, 'images'> & { images: string[] }
) {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  // 하루 3개 제한 체크
  const todayCount = await getTodayPlaceCount(request);
  if (todayCount >= 3) {
    throw new Error("하루 최대 3개까지만 장소를 등록할 수 있습니다");
  }

  // 장소 등록
  const { data: place, error: placeError } = await supabase
    .from('places')
    .insert({
      name: placeData.name,
      address: placeData.address,
      description: placeData.description,
      latitude: placeData.latitude || 0,
      longitude: placeData.longitude || 0,
      tags: placeData.tags,
      category_id: placeData.category_id,
      region_id: placeData.region_id,
      user_id: user.id,
      source: 'user',
      is_active: true,
      rating: 0,
      price_range: 2
    })
    .select()
    .single();

  if (placeError) {
    console.error('Error creating user place:', placeError);
    throw new Error("장소 등록 중 오류가 발생했습니다");
  }

  // 이미지 등록
  if (placeData.images.length > 0) {
    const imageInserts = placeData.images.map((imageUrl, index) => ({
      place_id: place.id,
      image_url: imageUrl,
      display_order: index + 1,
      is_primary: index === 0
    }));

    const { error: imageError } = await supabase
      .from('place_images')
      .insert(imageInserts);

    if (imageError) {
      console.error('Error creating place images:', imageError);
      // 이미지 오류는 장소 등록을 실패시키지 않음
    }
  }

  return place;
}

/**
 * 유저의 등록한 장소 목록 조회
 */
export async function getUserPlaces(request: Request) {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  const { data: places, error } = await supabase
    .from('places')
    .select(`
      *,
      categories (
        id,
        name,
        icon
      ),
      regions (
        id,
        name
      ),
      place_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('user_id', user.id)
    .eq('source', 'user')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user places:', error);
    throw new Error("장소 목록 조회 중 오류가 발생했습니다");
  }

  return places || [];
}

/**
 * 유저 장소 삭제
 */
export async function deleteUserPlace(request: Request, placeId: number) {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  // 소유권 확인
  const { data: place, error: checkError } = await supabase
    .from('places')
    .select('user_id, source')
    .eq('id', placeId)
    .single();

  if (checkError || !place) {
    throw new Error("장소를 찾을 수 없습니다");
  }

  if (place.user_id !== user.id || place.source !== 'user') {
    throw new Error("삭제 권한이 없습니다");
  }

  // 장소 삭제 (연관된 이미지는 CASCADE로 자동 삭제)
  const { error: deleteError } = await supabase
    .from('places')
    .delete()
    .eq('id', placeId);

  if (deleteError) {
    console.error('Error deleting user place:', deleteError);
    throw new Error("장소 삭제 중 오류가 발생했습니다");
  }

  return { success: true };
}

/**
 * 이미지 업로드 (Supabase Storage 사용)
 */
export async function uploadPlaceImage(request: Request, file: File): Promise<string> {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  try {
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // 서비스 키로 관리자 권한 클라이언트 생성 (RLS 우회)
    const adminSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 관리자 권한으로 이미지 업로드 (RLS 우회)
    const { data, error } = await adminSupabase.storage
      .from('place-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error("업로드된 파일 경로를 찾을 수 없습니다");
    }

    // 공개 URL 생성 (일반 클라이언트로도 가능)
    const { data: { publicUrl } } = supabase.storage
      .from('place-images')
      .getPublicUrl(data.path);

    return publicUrl;

  } catch (error) {
    console.error('Error in uploadPlaceImage:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("이미지 업로드 중 알 수 없는 오류가 발생했습니다");
  }
}