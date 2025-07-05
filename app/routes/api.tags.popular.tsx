import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getPopularTags } from "~/lib/search.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || "20";
    const parsedLimit = parseInt(limitParam);
    
    // 파라미터 검증: NaN이거나 음수인 경우 기본값 20 사용
    const limit = isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : Math.min(parsedLimit, 100);
    
    const popularTags = await getPopularTags(request, limit);
    
    return json({ popularTags });
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    return json({ popularTags: [] }, { status: 500 });
  }
} 