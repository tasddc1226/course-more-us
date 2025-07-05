import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getTagSuggestions } from "~/lib/search.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() || "";
    const limitParam = url.searchParams.get("limit") || "10";
    const parsedLimit = parseInt(limitParam);
    
    // 파라미터 검증: NaN이거나 음수인 경우 기본값 10 사용
    const limit = isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : Math.min(parsedLimit, 50);
    
    if (!query) {
      return json({ suggestions: [] });
    }
    
    const suggestions = await getTagSuggestions(request, query, limit);
    
    return json({ suggestions });
  } catch (error) {
    console.error("Error fetching tag suggestions:", error);
    return json({ suggestions: [] }, { status: 500 });
  }
} 