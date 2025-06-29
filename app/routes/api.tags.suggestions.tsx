import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getTagSuggestions } from "~/lib/search.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() || "";
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
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