import { createSupabaseServerClient } from "./supabase.server";
import type { Tables } from "~/types/database.types";

// 장소 및 지역 기반 검색 함수
export type PlaceSearchResult = Tables<'places'> & {
  region: Pick<Tables<'regions'>, 'id' | 'name'> | null;
  category: Pick<Tables<'categories'>, 'id' | 'name' | 'icon'> | null;
  place_images: Array<Pick<Tables<'place_images'>, 'image_url' | 'alt_text'>> | null;
};

/**
 * Supabase 풀 텍스트 검색을 활용해 장소를 검색한다.
 *  - name, description 컬럼에 대해 websearch 타입으로 검색
 *  - 태그 배열은 ilike ANY 로 간단 처리
 *  - is_active=true 인 레코드만 반환
 *  - 기본 20개까지 반환
 */
export async function searchPlaces(request: Request, query: string, regionId?: number) {
  if (!query) {
    return [] as PlaceSearchResult[];
  }

  const supabase = createSupabaseServerClient(request);

  // 기본 쿼리 빌더
  let builder = supabase
    .from('places')
    .select(
      `*,
      region:regions(id, name),
      category:categories(id, name, icon),
      place_images(image_url, alt_text)`
    )
    .eq('is_active', true);

  if (regionId) {
    builder = builder.eq('region_id', regionId);
  }

  const { data, error } = await builder
    .textSearch('name,description', query, { type: 'websearch' })
    .limit(20);

  if (error) throw error;
  return data as PlaceSearchResult[];
}