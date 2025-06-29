import { createSupabaseServerClient } from "./supabase.server";
import type { Tables } from "~/types/database.types";

// 장소 및 지역 기반 검색 함수
export type PlaceSearchResult = Tables<'places'> & {
  region: Pick<Tables<'regions'>, 'id' | 'name'> | null;
  category: Pick<Tables<'categories'>, 'id' | 'name' | 'icon'> | null;
  place_images: Array<Pick<Tables<'place_images'>, 'image_url' | 'alt_text'>> | null;
};

/**
 * 태그 기반 검색을 포함한 통합 검색 함수
 * 1. 이름/설명에서 Full Text Search
 * 2. 태그 배열에서 포함 검색 (ilike 사용)
 * 3. 결과를 점수별로 정렬 (이름 매치 > 태그 매치 > 설명 매치)
 */
export async function searchPlaces(request: Request, query: string, regionId?: number) {
  if (!query) {
    return [] as PlaceSearchResult[];
  }

  const supabase = createSupabaseServerClient(request);
  const trimmedQuery = query.trim();

  // 지역 필터링을 선택적으로 적용하는 baseQuery 생성 함수
  const createBaseQuery = () => {
    let query = supabase
      .from('places')
      .select(`
        *,
        regions!left(id, name),
        categories!left(id, name, icon),
        place_images!left(image_url, alt_text)
      `)
      .eq('is_active', true);

    // 지역 ID가 명시적으로 제공된 경우에만 필터링 적용
    if (regionId && regionId > 0) {
      query = query.eq('region_id', regionId);
    }

    return query;
  };

  // 1. 이름에서 정확히 매치하는 경우 (최고 우선순위)
  const exactNameQuery = createBaseQuery()
    .ilike('name', `%${trimmedQuery}%`)
    .limit(10);

  // 2. 태그에서 매치하는 경우 - overlaps 연산자 사용 (배열 교집합)
  const tagQuery = createBaseQuery()
    .overlaps('tags', [trimmedQuery])
    .limit(10);

  // 3. 주소에서 부분 매치하는 경우 (설명 검색 제외)
  const addressQuery = createBaseQuery()
    .ilike('address', `%${trimmedQuery}%`)
    .limit(10);

  try {
    // 모든 쿼리를 병렬로 실행 (설명 검색 제외)
    const [exactNameResult, tagResult, addressResult] = await Promise.all([
      exactNameQuery,
      tagQuery,
      addressQuery
    ]);

    // 에러 체크 및 결과 로깅
    if (exactNameResult.error) {
      console.error('❌ Exact name search error:', exactNameResult.error);
      throw exactNameResult.error;
    }
    if (tagResult.error) {
      console.error('❌ Tag search error:', tagResult.error);
      throw tagResult.error;
    }
    if (addressResult.error) {
      console.error('❌ Address search error:', addressResult.error);
      throw addressResult.error;
    }

    // 우선순위 기반 결과 병합 및 중복 제거
    const resultsMap = new Map<number, PlaceSearchResult & { score: number }>();

    // 1순위: 이름 매치 (점수: 100)
    exactNameResult.data?.forEach((place) => {
      resultsMap.set(place.id, { ...place as unknown as PlaceSearchResult, score: 100 });
    });

    // 2순위: 태그 매치 (점수: 90)  
    tagResult.data?.forEach((place) => {
      if (!resultsMap.has(place.id)) {
        resultsMap.set(place.id, { ...place as unknown as PlaceSearchResult, score: 90 });
      }
    });

    // 3순위: 주소 매치 (점수: 80)
    addressResult.data?.forEach((place) => {
      if (!resultsMap.has(place.id)) {
        resultsMap.set(place.id, { ...place as unknown as PlaceSearchResult, score: 80 });
      }
    });

    // 점수 순 정렬 후 score 필드 제거
    const finalResults = Array.from(resultsMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(result => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score, ...place } = result;
        return place;
      });

    return finalResults;

  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * 인기 태그 목록을 가져오는 함수
 */
export async function getPopularTags(request: Request, limit = 20) {
  const supabase = createSupabaseServerClient(request);

  try {
    const { data, error } = await supabase
      .from('places')
      .select('tags')
      .eq('is_active', true)
      .not('tags', 'is', null);

    if (error) throw error;

    // 모든 태그를 하나의 배열로 합치고 빈도수 계산
    const tagCounts = new Map<string, number>();
    
    data?.forEach(place => {
      place.tags?.forEach(tag => {
        if (tag && tag.trim()) {
          const normalizedTag = tag.trim();
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      });
    });

    // 빈도수 순으로 정렬
    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return [];
  }
}

/**
 * 태그 자동완성을 위한 함수
 */
export async function getTagSuggestions(request: Request, query: string, limit = 10) {
  if (!query || query.length < 1) return [];

  const supabase = createSupabaseServerClient(request);

  try {
    const { data, error } = await supabase
      .from('places')
      .select('tags')
      .eq('is_active', true)
      .not('tags', 'is', null);

    if (error) throw error;

    // 입력한 텍스트로 시작하는 태그들을 필터링
    const matchingTags = new Set<string>();
    const queryLower = query.toLowerCase();

    data?.forEach(place => {
      place.tags?.forEach(tag => {
        if (tag && tag.toLowerCase().includes(queryLower)) {
          matchingTags.add(tag);
        }
      });
    });

    return Array.from(matchingTags)
      .sort()
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching tag suggestions:', error);
    return [];
  }
}

/**
 * 지역 검색 함수 - 지역명과 키워드 기반 검색
 */
export async function searchRegions(request: Request, query: string, limit = 10) {
  if (!query || query.length < 1) return [];

  const supabase = createSupabaseServerClient(request);
  const trimmedQuery = query.trim();

  try {
    // 기본 지역 검색 (현재 스키마 기준)
    const { data, error } = await supabase
      .from('regions')
      .select('id, name, slug, description')
      .ilike('name', `%${trimmedQuery}%`)
      .order('name')
      .limit(limit);

    if (error) throw error;

    return data?.map(region => ({
      ...region,
      match_score: region.name.toLowerCase().startsWith(trimmedQuery.toLowerCase()) ? 100 : 80
    })) || [];

  } catch (error) {
    console.error('Error searching regions:', error);
    return [];
  }
}

/**
 * 주요 지역 목록 조회 (기본 지역들)
 */
export async function getPopularRegions(request: Request, limit = 5) {
  const supabase = createSupabaseServerClient(request);

  try {
    // 주요 지역들 (성수동, 강남, 홍대, 이태원, 명동) 우선 표시
    const popularSlugs = ['seongsu', 'gangnam', 'hongdae', 'itaewon', 'myeongdong'];
    
    const { data, error } = await supabase
      .from('regions')
      .select('id, name, slug, description')
      .in('slug', popularSlugs)
      .limit(limit);

    if (error) throw error;
    
    // 정해진 순서대로 정렬
    const orderedResults = popularSlugs
      .map(slug => data?.find(region => region.slug === slug))
      .filter(Boolean)
      .slice(0, limit);

    return orderedResults;

  } catch (error) {
    console.error('Error fetching popular regions:', error);
    return [];
  }
}

/**
 * 지역별 장소 개수 조회 (통계용)
 */
export async function getRegionStats(request: Request) {
  const supabase = createSupabaseServerClient(request);

  try {
    const { data, error } = await supabase
      .from('places')
      .select(`
        region_id,
        regions!inner(name, slug)
      `)
      .eq('is_active', true);

    if (error) throw error;

    // 지역별 장소 수 집계
    const regionCounts = new Map<number, { name: string; slug: string; count: number }>();
    
    data?.forEach(place => {
      if (place.region_id && place.regions) {
        const existing = regionCounts.get(place.region_id);
        if (existing) {
          existing.count++;
        } else {
          regionCounts.set(place.region_id, {
            name: place.regions.name,
            slug: place.regions.slug,
            count: 1
          });
        }
      }
    });

    return Array.from(regionCounts.entries()).map(([id, stats]) => ({
      region_id: id,
      ...stats
    }));

  } catch (error) {
    console.error('Error fetching region stats:', error);
    return [];
  }
}