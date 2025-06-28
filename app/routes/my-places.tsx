import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from '@remix-run/node'
import { useLoaderData, Link, useSubmit, useActionData } from '@remix-run/react'
import { getUserPlaces, deleteUserPlace, updateUserPlace } from '~/lib/user-places.server'
import { getTimeSlots } from '~/lib/data.server'
import { Button, Modal } from '~/components/ui'
import { StarRating } from '~/components/forms'
import { ROUTES } from '~/constants/routes'
import { requireAuth } from '~/lib/auth.server'
import { useState, useEffect } from 'react'
import type { Tables } from '~/types/database.types'


export const meta: MetaFunction = () => {
  return [
    { title: '내 장소 - 코스모스' },
    { name: 'description', content: '내가 등록한 장소 목록' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request)
  
  const [places, timeSlots] = await Promise.all([
    getUserPlaces(request),
    getTimeSlots(request)
  ])
  
  return json({ 
    places, 
    timeSlots: timeSlots as Tables<'time_slots'>[] 
  })
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

  if (intent === 'update' && placeId) {
    try {
      const rating = parseFloat(formData.get('rating') as string)
      const selectedTimeSlot = formData.get('selectedTimeSlot') ? parseInt(formData.get('selectedTimeSlot') as string) : undefined
      const selectedPeriod = formData.get('selectedPeriod') as 'weekday' | 'weekend' | undefined

      await updateUserPlace(request, placeId, {
        rating: isNaN(rating) ? undefined : rating,
        selectedTimeSlot,
        selectedPeriod
      })
      
      return json({ success: true, message: '장소 정보가 수정되었습니다' })
    } catch (error) {
      return json({ 
        error: error instanceof Error ? error.message : '수정 중 오류가 발생했습니다' 
      }, { status: 400 })
    }
  }

  return json({ error: '잘못된 요청입니다' }, { status: 400 })
}

export default function MyPlaces() {
  const { places, timeSlots } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()
  const [deletingPlaceId, setDeletingPlaceId] = useState<number | null>(null)
  const [editingPlace, setEditingPlace] = useState<(typeof places)[0] | null>(null)
  const [rating, setRating] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // 운영시간 UI용 상태
  const [selectedPeriod, setSelectedPeriod] = useState<'weekday' | 'weekend'>('weekday')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)

  const handleDelete = (placeId: number, placeName: string) => {
    if (confirm(`"${placeName}"을(를) 정말 삭제하시겠어요?\n\n삭제한 장소는 복구할 수 없습니다.`)) {
      setDeletingPlaceId(placeId)
      submit(
        { intent: 'delete', placeId: placeId.toString() },
        { method: 'post' }
      )
    }
  }

  const handleEditClick = (place: (typeof places)[0]) => {
    setEditingPlace(place)
    setRating(place.rating || 0)
    
    // place_time_slots에서 시간대 정보 추출
    const placeTimeSlot = place.place_time_slots?.[0]
    
    if (placeTimeSlot && placeTimeSlot.time_slots) {
      // 시간대가 등록되어 있으면 해당 정보로 설정
      setSelectedTimeSlot(placeTimeSlot.time_slots.id)
      
      // 운영시간에서 평일/주말 판단
      const existingHours = place.operating_hours as Record<string, string> || {}
      const weekdayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      const weekendKeys = ['saturday', 'sunday']
      
      const hasWeekdayData = weekdayKeys.some(key => existingHours[key])
      const hasWeekendData = weekendKeys.some(key => existingHours[key])
      
      if (hasWeekdayData) {
        setSelectedPeriod('weekday')
      } else if (hasWeekendData) {
        setSelectedPeriod('weekend')
      } else {
        setSelectedPeriod('weekday')
      }
    } else {
      // 시간대 정보가 없으면 기본값
      setSelectedPeriod('weekday')
      setSelectedTimeSlot(null)
    }
  }

  const handleEditSubmit = () => {
    if (!editingPlace) return
    
    const formData = new FormData()
    formData.append('intent', 'update')
    formData.append('placeId', editingPlace.id.toString())
    formData.append('rating', rating.toString())
    
    // 선택된 시간대 정보 전송
    if (selectedTimeSlot !== null) {
      formData.append('selectedTimeSlot', selectedTimeSlot.toString())
      formData.append('selectedPeriod', selectedPeriod)
    }
    
    submit(formData, { method: 'post' })
    setEditingPlace(null)
  }

  const selectTimeSlot = (timeSlotId: number) => {
    setSelectedTimeSlot(selectedTimeSlot === timeSlotId ? null : timeSlotId)
  }

  // 성공 메시지 처리
  useEffect(() => {
    if (actionData && 'success' in actionData && 'message' in actionData && actionData.success) {
      setShowSuccessMessage(true)
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000) // 3초 후 자동 숨김
      return () => clearTimeout(timer)
    }
  }, [actionData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {/* 헤더 */}
              <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-white/20">
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
        {/* 성공 메시지 */}
        {showSuccessMessage && actionData && 'message' in actionData && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{String(actionData.message)}</span>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="absolute top-2 right-2 text-green-700 hover:text-green-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

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
                        {place.rating && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="font-medium">평점:</span>
                            <div className="ml-2 flex items-center gap-1">
                              <StarRating
                                value={place.rating}
                                onChange={() => {}} // 읽기 전용
                                size="sm"
                                disabled={true}
                                className="pointer-events-none"
                              />
                              <span className="text-yellow-600 font-medium">
                                {place.rating.toFixed(1)}점
                              </span>
                            </div>
                          </div>
                        )}
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

                      {/* 버튼 그룹 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(place)}
                          className="flex-1 text-sm font-medium py-2 px-4 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(place.id, place.name)}
                          disabled={isDeleting}
                          className={`flex-1 text-sm font-medium py-2 px-4 rounded-md transition-colors ${
                            isDeleting
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {isDeleting ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
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

      {/* 수정 모달 */}
      {editingPlace && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPlace(null)}
          title={`${editingPlace.name} 수정`}
        >
          <div className="space-y-6">
            {/* 별점 입력 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                장소 평점
              </div>
              <div className="flex flex-col items-start gap-3">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size="md"
                />
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  <span className="font-medium">현재 평점:</span> {rating.toFixed(1)}점 / 5.0점
                </div>
              </div>
            </div>
            
            {/* 운영시간 설정 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                운영시간 정보
              </div>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-3">
                  💡 직접 갔었던 시간대를 입력해주세요
                </div>
                
                {/* 평일/주말 선택 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">방문 시기</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPeriod('weekday')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPeriod === 'weekday'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      평일 (월-금)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPeriod('weekend')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPeriod === 'weekend'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      주말 (토-일)
                    </button>
                  </div>
                </div>

                {/* 시간대 선택 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">방문했던 시간대</div>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map(ts => (
                      <button
                        key={ts.id}
                        type="button"
                        onClick={() => selectTimeSlot(ts.id)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors text-left ${
                          selectedTimeSlot === ts.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="font-semibold">{ts.id}. {ts.name}</div>
                      </button>
                    ))}
                  </div>
                  {selectedTimeSlot !== null && (
                    <div className="mt-2 text-xs text-gray-600">
                      선택된 시간대: {selectedTimeSlot}번
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setEditingPlace(null)}
                className="flex-1 py-3 text-gray-600 border-gray-300 hover:bg-gray-50 transition-all"
              >
                <span className="mr-2">✕</span>
                취소
              </Button>
              <Button
                onClick={handleEditSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">✓</span>
                수정하기
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}