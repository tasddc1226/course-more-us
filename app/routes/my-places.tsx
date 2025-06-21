import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from '@remix-run/node'
import { useLoaderData, Link, useSubmit } from '@remix-run/react'
import { getUserPlaces, deleteUserPlace } from '~/lib/user-places.server'
import { Button } from '~/components/ui'
import { ROUTES } from '~/constants/routes'
import { requireAuth } from '~/lib/auth.server'
import { useState } from 'react'

export const meta: MetaFunction = () => {
  return [
    { title: '내 장소 - 코스모스' },
    { name: 'description', content: '내가 등록한 장소 목록' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request)
  
  const places = await getUserPlaces(request)
  return json({ places })
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request)
  
  const formData = await request.formData()
  const intent = formData.get('intent')
  const placeId = parseInt(formData.get('placeId') as string)

  if (intent === 'delete' && placeId) {
    try {
      await deleteUserPlace(request, placeId)
      return json({ success: true })
    } catch (error) {
      return json({ 
        error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다' 
      }, { status: 400 })
    }
  }

  return json({ error: '잘못된 요청입니다' }, { status: 400 })
}

export default function MyPlaces() {
  const { places } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const [deletingPlaceId, setDeletingPlaceId] = useState<number | null>(null)

  const handleDelete = (placeId: number, placeName: string) => {
    if (confirm(`"${placeName}"을(를) 정말 삭제하시겠어요?\n\n삭제한 장소는 복구할 수 없습니다.`)) {
      setDeletingPlaceId(placeId)
      submit(
        { intent: 'delete', placeId: placeId.toString() },
        { method: 'post' }
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.HOME}
                className="text-purple-600 hover:text-purple-700"
              >
                ← 홈으로
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">내 장소</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {places.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              아직 등록한 장소가 없어요
            </h2>
            <p className="text-gray-600 mb-6">
              다른 커플들에게 추천하고 싶은 데이트 장소를 등록해보세요!
            </p>
            <Link to={ROUTES.REGISTER_PLACE}>
              <Button>첫 장소 등록하기</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                총 {places.length}개의 장소를 등록했어요
              </h2>
              <p className="text-gray-600">
                등록한 장소는 다른 사용자들에게 추천될 수 있습니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => {
                const primaryImage = place.place_images?.find(img => img.is_primary) || place.place_images?.[0]
                const isDeleting = deletingPlaceId === place.id

                return (
                  <div key={place.id} className="bg-white shadow rounded-lg overflow-hidden">
                    {/* 이미지 */}
                    {primaryImage ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={primaryImage.image_url}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">이미지 없음</span>
                      </div>
                    )}

                    {/* 내용 */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {place.name}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          {place.categories?.icon}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {place.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="font-medium">지역:</span>
                          <span className="ml-1">{place.regions?.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="font-medium">등록일:</span>
                          <span className="ml-1">{formatDate(place.created_at!)}</span>
                        </div>
                      </div>

                      {/* 태그 */}
                      {place.tags && place.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {place.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                            {place.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{place.tags.length - 3}개
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDelete(place.id, place.name)}
                        disabled={isDeleting}
                        className={`w-full text-sm font-medium py-2 px-4 rounded-md transition-colors ${
                          isDeleting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {isDeleting ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* 플로팅 추가 버튼 - 장소가 있을 때만 표시 */}
      {places.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <Link 
            to={ROUTES.REGISTER_PLACE}
            className="block"
          >
            <button 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group-hover:scale-105 active:scale-95"
              title="새 장소 등록"
              aria-label="새 장소 등록"
            >
              <svg 
                className="w-6 h-6 sm:w-7 sm:h-7 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </button>
          </Link>
          
          {/* 툴팁 */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              새 장소 등록
              <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}