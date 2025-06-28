import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData, useActionData, Link, useFetcher } from "@remix-run/react"
import { requireAuth } from "~/lib/auth.server"
import { getUserFavorites, toggleFavorite, getFavoritesCount } from "~/lib/favorites.server"
import { PageHeader } from "~/components/common"
import { Button, ErrorMessage } from "~/components/ui"
import { ROUTES } from "~/constants/routes"

export const meta: MetaFunction = () => {
  return [
    { title: "즐겨찾기 - 코스모스" },
    { name: "description", content: "내가 즐겨찾기한 데이트 장소들을 관리하세요" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request)
  
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 10
    const offset = (page - 1) * limit

    const [favoritesData, totalCount] = await Promise.all([
      getUserFavorites(request, offset, limit),
      getFavoritesCount(request)
    ])

    return json({
      user,
      favorites: favoritesData.favorites,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error loading favorites:', error)
    return json({
      user,
      favorites: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
      },
      error: '즐겨찾기 목록을 불러오는 중 오류가 발생했습니다.'
    })
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get('intent') as string

  if (intent === 'remove-favorite') {
    const placeId = parseInt(formData.get('placeId') as string)

    if (!placeId) {
      return json({ 
        error: '장소 정보가 올바르지 않습니다.' 
      }, { status: 400 })
    }

    try {
      await toggleFavorite(request, placeId)
      return json({ 
        success: true,
        message: '즐겨찾기에서 제거되었습니다.',
        removedPlaceId: placeId
      })
    } catch (error) {
      console.error('Remove favorite error:', error)
      return json({ 
        error: '즐겨찾기 제거 중 오류가 발생했습니다.' 
      }, { status: 500 })
    }
  }

  return json({ error: '잘못된 요청입니다.' }, { status: 400 })
}

function FavoriteCard({ 
  favorite, 
  onRemove 
}: { 
  favorite: any
  onRemove: (placeId: number) => void
}) {
  const place = favorite.places
  const fetcher = useFetcher()

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {place.place_images && place.place_images.length > 0 && (
        <img
          src={place.place_images[0].image_url}
          alt={place.place_images[0].alt_text || place.name}
          className="w-full h-32 object-cover"
        />
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{place.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{place.address}</p>
            {place.categories && (
              <span className="inline-block text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {place.categories.name}
              </span>
            )}
          </div>
          
          <button
            onClick={() => onRemove(place.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full p-2 transition-colors"
            title="즐겨찾기 해제"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        
        {place.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {place.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            {place.rating && (
              <div className="flex items-center text-yellow-600">
                <span>⭐</span>
                <span className="ml-1">{place.rating}</span>
              </div>
            )}
            {place.price_range && (
              <div className="flex items-center text-green-600">
                <span>💰</span>
                <span className="ml-1">{'₩'.repeat(Math.min(place.price_range, 4))}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-1">
            {place.is_partnership && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                제휴
              </span>
            )}
          </div>
        </div>
        
        {place.tags && place.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {place.tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
            {place.tags.length > 3 && (
              <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
                +{place.tags.length - 3}개 더
              </span>
            )}
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          즐겨찾기 추가: {new Date(favorite.created_at).toLocaleDateString('ko-KR')}
        </div>
      </div>
    </div>
  )
}

export default function MyFavorites() {
  const { user, favorites, pagination, error } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const fetcher = useFetcher()

  const handleRemoveFavorite = (placeId: number) => {
    fetcher.submit(
      {
        intent: 'remove-favorite',
        placeId: placeId.toString()
      },
      { method: 'post' }
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="내 즐겨찾기"
        subtitle="마음에 든 데이트 장소들을 모아두었어요"
        user={user}
      />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {error && (
          <ErrorMessage message={error} className="mb-6" />
        )}

        {actionData?.error && (
          <ErrorMessage message={actionData.error} className="mb-6" />
        )}

        {actionData?.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {actionData.message}
          </div>
        )}
        
        {/* 즐겨찾기 통계 */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                총 {pagination.totalCount}개의 즐겨찾기
              </h2>
              <p className="text-sm text-gray-600">
                특별한 장소들을 저장해두고 언제든 다시 찾아보세요
              </p>
            </div>
            <div className="text-red-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 즐겨찾기 목록 */}
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">💔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 즐겨찾기가 없어요
            </h3>
            <p className="text-gray-600 mb-6">
              데이트 코스 추천에서 마음에 든 장소에<br />
              하트 버튼을 눌러 즐겨찾기를 추가해보세요!
            </p>
            <Link to={ROUTES.HOME}>
              <Button>데이트 코스 찾으러 가기</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {favorites.map((favorite) => (
                <FavoriteCard
                  key={favorite.id}
                  favorite={favorite}
                  onRemove={handleRemoveFavorite}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {pagination.hasPrev && (
                  <Link 
                    to={`?page=${pagination.currentPage - 1}`}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    이전
                  </Link>
                )}
                
                <span className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                
                {pagination.hasNext && (
                  <Link 
                    to={`?page=${pagination.currentPage + 1}`}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    다음
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}