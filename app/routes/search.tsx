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
      className="group block bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      {/* 이미지 영역 */}
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
        {place.place_images && place.place_images.length > 0 ? (
          <>
            <img
              src={place.place_images[0].image_url}
              alt={place.place_images[0].alt_text ?? place.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-purple-300 mb-2">📷</div>
              <p className="text-sm text-purple-500">이미지 준비중</p>
            </div>
          </div>
        )}
        
        {/* 카테고리 뱃지 */}
        {place.category && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-gray-700">
              {place.category.icon} {place.category.name}
            </span>
          </div>
        )}

        {/* 지역 뱃지 */}
        {place.region && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-purple-600/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-white">
              📍 {place.region.name}
            </span>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-5">
        {/* 제목 */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-700 transition-colors">
          {place.name}
        </h3>

        {/* 설명 */}
        {place.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        )}

        {/* 태그 영역 */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {place.tags.slice(0, 3).map((tag, index) => (
              <button
                key={index}
                onClick={(e) => handleTagClick(tag, e)}
                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-full transition-all duration-200 hover:shadow-md transform hover:scale-105"
              >
                <span className="text-xs font-medium">#{tag}</span>
              </button>
            ))}
            {place.tags.length > 3 && (
              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                +{place.tags.length - 3}개 더
              </span>
            )}
          </div>
        )}

        {/* 하단 정보 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {place.rating && place.rating > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm font-medium text-gray-700">
                  {place.rating.toFixed(1)}
                </span>
              </div>
            )}
            {place.price_range && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  {'💰'.repeat(place.price_range)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
            <span className="text-sm font-medium">자세히 보기</span>
            <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();
  const { q, results } = data;

  return (
    <UserLayout title="검색">
      {/* 검색바 섹션 */}
      <div className="mb-6">
        <SearchBar initialQuery={q} />
      </div>

      {/* 검색 결과 헤더 */}
      {q ? (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              &quot;{q}&quot; 검색 결과
            </h2>
            <p className="text-sm text-white/70">
              총 {results.length}개의 장소를 찾았습니다
            </p>
          </div>
          {results.length > 0 && (
            <div className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
              이름·태그·설명 기준 정렬
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="text-white/60 text-4xl mb-3">🔍</div>
          <p className="text-white/80 font-medium">검색어를 입력하세요</p>
          <p className="text-white/60 text-sm mt-1">장소명, 태그, 지역으로 검색할 수 있습니다</p>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {results.length === 0 && q && (
        <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
          <div className="text-gray-300 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-500 mb-4">
            &quot;{q}&quot;에 대한 검색 결과를 찾을 수 없습니다
          </p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• 다른 키워드로 검색해보세요</p>
            <p>• 태그나 지역명을 시도해보세요</p>
            <p>• 검색어를 줄여보세요</p>
          </div>
        </div>
      )}

      {/* 검색 결과 그리드 */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {results.map((place: PlaceSearchResult) => (
            <ResultCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </UserLayout>
  );
}