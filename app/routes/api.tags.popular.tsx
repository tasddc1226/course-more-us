import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getPopularTags } from "~/lib/search.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    
    const popularTags = await getPopularTags(request, limit);
    
    return json({ popularTags });
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    return json({ popularTags: [] }, { status: 500 });
  }
} 