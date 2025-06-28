import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { searchPlaces, type PlaceSearchResult } from "~/lib/search.server";
import { SearchBar } from "~/components/common";
import { getUser } from "~/lib/auth.server";
import { ROUTES } from "~/constants/routes";

export const meta: MetaFunction = () => [
  { title: "검색 - 코스모스" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const regionIdParam = url.searchParams.get("regionId");
  const regionId = regionIdParam ? parseInt(regionIdParam) : undefined;

  const user = await getUser(request);
  if (!user) {
    return redirect(ROUTES.LOGIN);
  }

  const results = await searchPlaces(request, q, regionId);
  return json({ q, results });
}

function ResultCard({ place }: { place: PlaceSearchResult }) {
  return (
    <Link
      to={`/${place.id}`}
      className="flex gap-4 bg-white rounded-xl shadow-sm overflow-hidden hover:ring-2 hover:ring-purple-100 transition"
    >
      {place.place_images && place.place_images.length > 0 ? (
        <img
          src={place.place_images[0].image_url}
          alt={place.place_images[0].alt_text ?? place.name}
          className="w-24 h-24 object-cover"
        />
      ) : (
        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-gray-400">
          📷
        </div>
      )}
      <div className="py-3 pr-4 flex-1">
        <div className="font-semibold text-gray-800 mb-1 line-clamp-1">
          {place.name}
        </div>
        {place.region && (
          <div className="text-xs text-gray-500 mb-1">{place.region.name}</div>
        )}
        {place.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{place.description}</p>
        )}
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();
  const { q, results } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex flex-col gap-4">
          <h1 className="text-xl font-bold text-purple-600">검색</h1>
          <SearchBar initialQuery={q} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {q ? (
          <h2 className="text-sm text-gray-500">
            <span className="font-semibold text-purple-600">{q}</span> 검색 결과 {results.length}
            개
          </h2>
        ) : (
          <p className="text-sm text-gray-500">검색어를 입력하세요.</p>
        )}

        {results.length === 0 && q && (
          <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
        )}

        {results.map((place: PlaceSearchResult) => (
          <ResultCard key={place.id} place={place} />
        ))}
      </main>
    </div>
  );
}