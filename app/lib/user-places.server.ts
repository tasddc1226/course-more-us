import { createSupabaseServerClient, supabaseAdmin } from "~/lib/supabase.server";
import { findOrCreateRegion } from "~/lib/data.server";
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
    rating: number;
    tags: string[];
    images: string[];
    selectedTimeSlot?: number;
    selectedPeriod?: 'weekday' | 'weekend';
  }
) {
  console.log('createUserPlaceFromLocation 시작')
  console.log('받은 데이터:', placeData)
  
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('인증 오류:', authError)
    throw new Error("인증이 필요합니다");
  }
  
  console.log('사용자 인증 성공:', user.id)

  // 하루 3개 제한 체크
  console.log('일일 제한 체크 중...')
  const todayCount = await getTodayPlaceCount(request);
  console.log('오늘 등록 수:', todayCount)
  if (todayCount >= 3) {
    throw new Error("하루 최대 3개까지만 장소를 등록할 수 있습니다");
  }

  // 지역 찾기 또는 생성
  console.log('지역 찾기/생성 중...', placeData.regionName)
  const region = await findOrCreateRegion(request, placeData.regionName);
  console.log('지역 정보:', region)

  // 장소 등록
  console.log('장소 DB 삽입 시작...')
  const placeInsertData = {
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
    rating: placeData.rating,
    price_range: 2
  }
  console.log('삽입할 장소 데이터:', placeInsertData)
  
  const { data: place, error: placeError } = await supabase
    .from('places')
    .insert(placeInsertData)
    .select()
    .single();

  if (placeError) {
    console.error('장소 DB 삽입 오류:', placeError);
    throw new Error("장소 등록 중 오류가 발생했습니다");
  }
  
  console.log('장소 등록 성공:', place)

  // 이미지 등록
  console.log('이미지 등록 시작, 이미지 수:', placeData.images.length)
  if (placeData.images.length > 0) {
    const imageInserts = placeData.images.map((imageUrl, index) => ({
      place_id: place.id,
      image_url: imageUrl,
      display_order: index + 1,
      is_primary: index === 0
    }));
    
    console.log('삽입할 이미지 데이터:', imageInserts)

    const { error: imageError } = await supabaseAdmin
      .from('place_images')
      .insert(imageInserts);

    if (imageError) {
      console.error('이미지 등록 오류:', imageError);
      // 이미지 오류는 장소 등록을 실패시키지 않음
    } else {
      console.log('이미지 등록 성공')
    }
  }

  // 시간대 정보 처리
  console.log('시간대 정보 처리 중...', { selectedTimeSlot: placeData.selectedTimeSlot, selectedPeriod: placeData.selectedPeriod })
  if (placeData.selectedTimeSlot && placeData.selectedPeriod) {
    // time_slots 테이블에서 해당 시간대의 start_time, end_time 조회
    const { data: timeSlot, error: timeSlotError } = await supabase
      .from('time_slots')
      .select('start_time, end_time')
      .eq('id', placeData.selectedTimeSlot)
      .single();

    if (timeSlotError) {
      console.error('시간대 조회 오류:', timeSlotError);
    }

    if (!timeSlotError && timeSlot) {
      console.log('시간대 정보:', timeSlot)
      // start_time~end_time 형식으로 운영시간 생성
      const timeRange = `${timeSlot.start_time}~${timeSlot.end_time}`;
      
      const operatingHours: Record<string, string> = {};
      if (placeData.selectedPeriod === 'weekday') {
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
          operatingHours[day] = timeRange;
        });
      } else {
        ['saturday', 'sunday'].forEach(day => {
          operatingHours[day] = timeRange;
        });
      }

      console.log('운영시간 설정:', operatingHours)

      // 장소의 운영시간 업데이트
      const { error: updateError } = await supabase
        .from('places')
        .update({ operating_hours: operatingHours })
        .eq('id', place.id);

      if (updateError) {
        console.error('운영시간 업데이트 오류:', updateError);
      }

      // place_time_slots 테이블에 시간대 정보 추가
      const { error: timeSlotInsertError } = await supabase
        .from('place_time_slots')
        .insert({
          place_id: place.id,
          time_slot_id: placeData.selectedTimeSlot
        });

      if (timeSlotInsertError) {
        console.error('시간대 정보 삽입 오류:', timeSlotInsertError);
      } else {
        console.log('시간대 정보 등록 성공')
      }
    }
  }

  console.log('createUserPlaceFromLocation 완료!')
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
      ),
      place_time_slots (
        time_slot_id,
        time_slots (
          id,
          name,
          start_time,
          end_time
        )
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
 * 유저 장소 수정 (평점과 운영시간만)
 */
export async function updateUserPlace(
  request: Request, 
  placeId: number,
  updateData: {
    rating?: number;
    operating_hours?: Record<string, number[]>;
    selectedTimeSlot?: number;
    selectedPeriod?: 'weekday' | 'weekend';
  }
) {
  const supabase = createSupabaseServerClient(request);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증이 필요합니다");
  }

  // 해당 장소가 현재 사용자의 것인지 확인
  const { data: existingPlace, error: fetchError } = await supabase
    .from('places')
    .select('user_id')
    .eq('id', placeId)
    .eq('source', 'user')
    .single();

  if (fetchError || !existingPlace) {
    throw new Error("장소를 찾을 수 없습니다");
  }

  if (existingPlace.user_id !== user.id) {
    throw new Error("수정 권한이 없습니다");
  }

  // 시간대 정보가 있으면 운영시간을 start_time~end_time 형식으로 변환
  let finalOperatingHours: Record<string, string> | Record<string, number[]> | undefined = updateData.operating_hours;
  
  if (updateData.selectedTimeSlot && updateData.selectedPeriod) {
    // time_slots 테이블에서 해당 시간대의 start_time, end_time 조회
    const { data: timeSlot, error: timeSlotError } = await supabase
      .from('time_slots')
      .select('start_time, end_time')
      .eq('id', updateData.selectedTimeSlot)
      .single();

    if (timeSlotError) {
      console.error('Error fetching time slot:', timeSlotError);
      throw new Error("시간대 정보 조회 중 오류가 발생했습니다");
    }

    // start_time~end_time 형식으로 운영시간 생성
    const timeRange = `${timeSlot.start_time}~${timeSlot.end_time}`;
    
    finalOperatingHours = {};
    if (updateData.selectedPeriod === 'weekday') {
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        (finalOperatingHours as Record<string, string>)[day] = timeRange;
      });
    } else {
      ['saturday', 'sunday'].forEach(day => {
        (finalOperatingHours as Record<string, string>)[day] = timeRange;
      });
    }

    // place_time_slots 테이블 업데이트 (기존 데이터 삭제 후 새로 추가)
    await supabase
      .from('place_time_slots')
      .delete()
      .eq('place_id', placeId);

    const { error: timeSlotInsertError } = await supabase
      .from('place_time_slots')
      .insert({
        place_id: placeId,
        time_slot_id: updateData.selectedTimeSlot
      });

    if (timeSlotInsertError) {
      console.error('Error updating place_time_slots:', timeSlotInsertError);
      // place_time_slots 오류는 전체 작업을 실패시키지 않음
    }
  }

  // 장소 정보 업데이트
  const { data: updatedPlace, error: updateError } = await supabase
    .from('places')
    .update({
      rating: updateData.rating,
      operating_hours: finalOperatingHours,
      updated_at: new Date().toISOString()
    })
    .eq('id', placeId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating user place:', updateError);
    throw new Error("장소 수정 중 오류가 발생했습니다");
  }

  return updatedPlace;
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