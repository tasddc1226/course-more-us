import type { PerplexityCourseResponse, SearchBasedPlaceInfo } from '~/types/perplexity';
import type { RecommendedPlace } from './recommendation/types';
import { createSupabaseServerClient } from './supabase.server';
import { getUser } from './auth.server';

// AI 검색 요청 정보 타입
export interface AISearchRequestInfo {
  userRequest: string;
  regionId: number;
  regionName: string;
  timeSlotIds: number[];
  date: string;
  interests: string[];
  budgetRange: { min: number; max: number };
}

// AI 검색 저장 결과 타입
export interface AISearchStorageResult {
  searchLogId?: number;
  success: boolean;
  error?: string;
}

/**
 * AI 검색 요청/응답을 비동기적으로 저장
 * 실패해도 사용자 경험에 영향을 주지 않도록 에러를 잡아서 로깅만 함
 */
export async function saveAISearchAsync(
  request: Request,
  searchRequest: AISearchRequestInfo,
  searchResponse?: PerplexityCourseResponse,
  isSuccessful: boolean = false,
  errorMessage?: string,
  searchDurationMs?: number,
  matchedPlaces?: Array<{ searchPlace: SearchBasedPlaceInfo; matchedPlace?: RecommendedPlace; confidence?: number }>
): Promise<void> {
  // 비동기 실행 - 실패해도 메인 플로우에 영향 없음
  setImmediate(async () => {
    try {
      console.log('🎯 AI 검색 정보 저장 시작...');
      
      const result = await saveAISearchToDatabase(
        request,
        searchRequest,
        searchResponse,
        isSuccessful,
        errorMessage,
        searchDurationMs,
        matchedPlaces
      );
      
      if (result.success) {
        console.log(`✅ AI 검색 정보 저장 완료 (ID: ${result.searchLogId})`);
      } else {
        console.error('❌ AI 검색 정보 저장 실패:', result.error);
      }
      
    } catch (error) {
      console.error('❌ AI 검색 정보 비동기 저장 중 오류:', error);
    }
  });
}

/**
 * AI 검색 정보를 데이터베이스에 저장하는 실제 함수
 */
async function saveAISearchToDatabase(
  request: Request,
  searchRequest: AISearchRequestInfo,
  searchResponse?: PerplexityCourseResponse,
  isSuccessful: boolean = false,
  errorMessage?: string,
  searchDurationMs?: number,
  matchedPlaces?: Array<{ searchPlace: SearchBasedPlaceInfo; matchedPlace?: RecommendedPlace; confidence?: number }>
): Promise<AISearchStorageResult> {
  try {
    const supabase = createSupabaseServerClient(request);
    const user = await getUser(request);
    
    // 사용자가 없으면 저장하지 않음 (비로그인 상태에서도 검색 가능하므로)
    if (!user) {
      console.log('📝 비로그인 사용자 - AI 검색 정보 저장 생략');
      return { success: true };
    }

    // 1. AI 검색 로그 저장
    const searchLogData = {
      user_id: user.id,
      search_request: searchRequest as Record<string, any>, // JSON으로 직렬화됨
      search_response: searchResponse ? {
        recommendedCourse: searchResponse.recommendedCourse,
        searchSummary: searchResponse.searchSummary,
        citations: searchResponse.citations
      } as Record<string, any> : null, // JSON으로 직렬화됨
      recommended_places_count: matchedPlaces?.length || 0,
      is_successful: isSuccessful,
      error_message: errorMessage || null,
      search_duration_ms: searchDurationMs || null,
      perplexity_citations: searchResponse?.citations || null
    };

    const { data: searchLog, error: logError } = await supabase
      .from('ai_search_logs')
      .insert(searchLogData)
      .select('id')
      .single();

    if (logError) {
      throw new Error(`검색 로그 저장 실패: ${logError.message}`);
    }

    console.log(`✅ AI 검색 로그 저장 완료 (ID: ${searchLog.id})`);

    // 2. AI 추천 장소들 저장
    if (searchLog.id && matchedPlaces && matchedPlaces.length > 0) {
      const placesToInsert = matchedPlaces.map(({ searchPlace, matchedPlace, confidence }) => ({
        ai_search_log_id: searchLog.id,
        place_name: searchPlace.name,
        category: searchPlace.category,
        time_slot: searchPlace.timeSlot,
        duration: searchPlace.duration,
        search_info: {
          recentReview: searchPlace.searchInfo?.recentReview || null,
          trendScore: searchPlace.searchInfo?.trendScore || 0,
          recommendationReason: searchPlace.searchInfo?.recommendationReason || null
        } as Record<string, any>, // JSON으로 직렬화됨
        special_tips: searchPlace.specialTips || null,
        matched_place_id: matchedPlace?.id || null,
        matching_confidence: confidence || null
      }));

      const { error: placesError } = await supabase
        .from('ai_recommended_places')
        .insert(placesToInsert);

      if (placesError) {
        console.error('❌ AI 추천 장소 저장 실패:', placesError.message);
      } else {
        console.log(`✅ AI 추천 장소 저장 완료 (${placesToInsert.length}개)`);
      }
    }

    return {
      searchLogId: searchLog.id,
      success: true
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('❌ AI 검색 정보 저장 실패:', errorMsg);
    
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * AI 추천 장소를 실제 places 테이블에 추가하는 함수
 */
export async function promoteAIPlaceToDatabase(
  request: Request,
  aiPlaceId: number,
  regionId: number,
  categoryId: number,
  additionalInfo?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    website?: string;
  }
): Promise<{ success: boolean; placeId?: number; error?: string }> {
  try {
    const supabase = createSupabaseServerClient(request);
    const user = await getUser(request);
    
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    // 1. AI 추천 장소 정보 가져오기
    const { data: aiPlace, error: aiPlaceError } = await supabase
      .from('ai_recommended_places')
      .select('*')
      .eq('id', aiPlaceId)
      .single();

    if (aiPlaceError || !aiPlace) {
      return {
        success: false,
        error: 'AI 추천 장소를 찾을 수 없습니다.'
      };
    }

    // 2. places 테이블에 새 장소 추가
    const newPlaceData = {
      name: aiPlace.place_name,
      description: aiPlace.special_tips || `AI가 추천한 ${aiPlace.category} 장소`,
      address: additionalInfo?.address || '주소 정보 없음', // 필수 필드이므로 기본값 설정
      latitude: additionalInfo?.latitude || null,
      longitude: additionalInfo?.longitude || null,
      phone: additionalInfo?.phone || null,
      website: additionalInfo?.website || null,
      rating: 0.0, // 기본값
      price_range: 2, // 기본값 (중간 가격대)
      is_partnership: false,
      operating_hours: {},
      tags: aiPlace.category ? [aiPlace.category] : [], // null 값 제거
      region_id: regionId,
      category_id: categoryId,
      user_id: user.id,
      source: 'ai_search',
      is_active: true
    };

    const { data: newPlace, error: placeError } = await supabase
      .from('places')
      .insert(newPlaceData)
      .select('id')
      .single();

    if (placeError) {
      throw new Error(`장소 생성 실패: ${placeError.message}`);
    }

    // 3. AI 추천 장소에 매칭된 장소 ID 업데이트
    const { error: updateError } = await supabase
      .from('ai_recommended_places')
      .update({
        matched_place_id: newPlace.id,
        matching_confidence: 1.0 // 완전 매칭 (승격)
      })
      .eq('id', aiPlaceId);

    if (updateError) {
      console.error('❌ AI 추천 장소 매칭 업데이트 실패:', updateError.message);
    }

    console.log(`✅ AI 장소 승격 완료 (AI ID: ${aiPlaceId} → Place ID: ${newPlace.id})`);

    return {
      success: true,
      placeId: newPlace.id
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('❌ AI 장소 승격 실패:', errorMsg);
    
    return {
      success: false,
      error: errorMsg
    };
  }
} 