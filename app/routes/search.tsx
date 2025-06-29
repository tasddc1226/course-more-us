import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { searchPlaces, type PlaceSearchResult } from "~/lib/search.server";
import { SearchBar, UserLayout } from "~/components/common";
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
  const navigate = useNavigate();

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

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
        <div className="flex items-center gap-2 mb-2">
          {place.region && (
            <span className="text-xs text-gray-500">{place.region.name}</span>
          )}
          {place.category && (
            <span className="text-xs text-gray-500">
              {place.category.icon} {place.category.name}
            </span>
          )}
        </div>
        {place.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{place.description}</p>
        )}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {place.tags.slice(0, 4).map((tag, index) => (
              <button
                key={index}
                onClick={(e) => handleTagClick(tag, e)}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                #{tag}
              </button>
            ))}
            {place.tags.length > 4 && (
              <span className="text-xs text-gray-400 px-1">
                +{place.tags.length - 4}개
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();
  const { q, results } = data;

  return (
    <UserLayout title="검색">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-xl">
        <SearchBar initialQuery={q} />
      </div>

      <div className="space-y-4">
        {q ? (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-white/90">
              <span className="font-semibold text-white">{q}</span> 검색 결과 {results.length}개
            </h2>
            {results.length > 0 && (
              <div className="text-xs text-white/70">
                이름·태그·설명 기준 정렬
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/70">검색어를 입력하세요.</p>
        )}

        {results.length === 0 && q && (
          <div className="text-center py-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <p className="text-gray-500 mb-2">검색 결과가 없습니다.</p>
            <p className="text-xs text-gray-400">
              다른 키워드나 태그로 검색해보세요.
            </p>
          </div>
        )}

        {results.map((place: PlaceSearchResult) => (
          <ResultCard key={place.id} place={place} />
        ))}
      </div>
    </UserLayout>
  );
}