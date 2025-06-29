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

  // 기본 필터 조건
  let baseQuery = supabase
    .from('places')
    .select(
      `*,
      region:regions(id, name),
      category:categories(id, name, icon),
      place_images(image_url, alt_text)`
    )
    .eq('is_active', true);

  if (regionId) {
    baseQuery = baseQuery.eq('region_id', regionId);
  }

  // 1. 이름에서 정확히 매치하는 경우 (최고 우선순위)
  const exactNameQuery = baseQuery
    .ilike('name', `%${trimmedQuery}%`)
    .limit(10);

  // 2. 태그에서 매치하는 경우 
  const tagQuery = baseQuery
    .overlaps('tags', [trimmedQuery])
    .limit(10);

  // 3. Full Text Search로 이름과 설명에서 검색
  const textSearchQuery = baseQuery
    .textSearch('name,description', trimmedQuery, { type: 'websearch' })
    .limit(10);

  // 4. 주소에서 부분 매치하는 경우 (가장 낮은 우선순위)
  const addressQuery = baseQuery
    .ilike('address', `%${trimmedQuery}%`)
    .limit(10);

  try {
    // 모든 쿼리를 병렬로 실행
    const [exactNameResult, tagResult, textSearchResult, addressResult] = await Promise.all([
      exactNameQuery,
      tagQuery,
      textSearchQuery,
      addressQuery
    ]);

    // 에러 체크
    if (exactNameResult.error) throw exactNameResult.error;
    if (tagResult.error) throw tagResult.error;
    if (textSearchResult.error) throw textSearchResult.error;
    if (addressResult.error) throw addressResult.error;

    // 결과 합치기 및 중복 제거
    const allResults = new Map<number, PlaceSearchResult & { score: number }>();

    // 1. 이름 정확 매치 (점수: 100)
    exactNameResult.data?.forEach((place: PlaceSearchResult) => {
      allResults.set(place.id, { ...place, score: 100 });
    });

    // 2. 태그 정확 매치 (점수: 90)
    tagResult.data?.forEach((place: PlaceSearchResult) => {
      if (!allResults.has(place.id)) {
        allResults.set(place.id, { ...place, score: 90 });
      }
    });

    // 3. Full Text Search 매치 (점수: 80)
    textSearchResult.data?.forEach((place: PlaceSearchResult) => {
      if (!allResults.has(place.id)) {
        allResults.set(place.id, { ...place, score: 80 });
      }
    });

    // 4. 주소 부분 매치 (점수: 70)
    addressResult.data?.forEach((place: PlaceSearchResult) => {
      if (!allResults.has(place.id)) {
        allResults.set(place.id, { ...place, score: 70 });
      }
    });

    // 점수 순으로 정렬하고 score 프로퍼티 제거
    return Array.from(allResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(result => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score, ...place } = result;
        return place;
      });

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