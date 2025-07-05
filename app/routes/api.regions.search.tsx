import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { searchRegions, getPopularRegions } from "~/lib/search.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = parseInt(url.searchParams.get("limit") || "10");

  try {
    if (!q) {
      // 검색어가 없으면 인기 지역 반환
      const popularRegions = await getPopularRegions(request, Math.min(limit, 10));
      return json({ 
        success: true,
        data: popularRegions,
        type: 'popular'
      });
    }

    // 지역 검색 실행
    const results = await searchRegions(request, q, Math.min(limit, 20));
    
    return json({ 
      success: true,
      data: results,
      type: 'search',
      query: q
    });

  } catch (error) {
    console.error('Region search API error:', error);
    return json({ 
      success: false, 
      error: 'Failed to search regions',
      data: []
    }, { status: 500 });
  }
} 