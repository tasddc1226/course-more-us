import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { useLoaderData, useActionData, Link, useNavigation, useFetcher } from '@remix-run/react'
import { useState } from 'react'
import { getCategories, getTimeSlots } from '~/lib/data.server'
import { createUserPlaceFromLocation, getTodayPlaceCount, uploadPlaceImage, extractRegionFromAddress } from '~/lib/user-places.server'
import { Button, Dropdown, type DropdownOption } from '~/components/ui'
import { ClientOnlyKakaoMap, PageHeader } from '~/components/common'
import { ImageUpload, StarRating } from '~/components/forms'
import { ROUTES } from '~/constants/routes'
import { requireAuth } from '~/lib/auth.server'
import type { PlaceLocationData } from '~/types/kakao-map'
import type { Tables } from '~/types/database.types'

export const meta: MetaFunction = () => {
  return [
    { title: '장소 등록 - 코스모스' },
    { name: 'description', content: '새로운 데이트 장소를 추천해주세요' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request)
  
  const url = new URL(request.url)
  const prefilledName = url.searchParams.get('name') || ''
  
  const [categories, todayCount, timeSlots] = await Promise.all([
    getCategories(request),
    getTodayPlaceCount(request),
    getTimeSlots(request)
  ])

  return json({ 
    categories: categories as Tables<'categories'>[], 
    todayCount, 
    timeSlots: timeSlots as Tables<'time_slots'>[],
    prefilledName
  })
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request)
  
  const formData = await request.formData()

  try {
    console.log('=== 장소 등록 시작 ===')
    console.log('FormData 내용:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`)
      } else {
        console.log(`${key}: ${value}`)
      }
    }

    // 일일 제한 체크
    const todayCount = await getTodayPlaceCount(request)
    console.log('오늘 등록 수:', todayCount)
    if (todayCount >= 3) {
      return json({ 
        error: '하루 최대 3개까지만 장소를 등록할 수 있습니다.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 지도에서 선택된 위치 정보 확인
    const placeName = formData.get('placeName') as string
    const address = formData.get('address') as string
    const latitude = parseFloat(formData.get('latitude') as string)
    const longitude = parseFloat(formData.get('longitude') as string)

    console.log('위치 정보:', { placeName, address, latitude, longitude })

    if (!placeName || !address || !latitude || !longitude) {
      console.log('위치 정보 누락!')
      return json({ 
        error: '지도에서 위치를 선택해주세요.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 주소에서 지역명 추출
    const regionName = extractRegionFromAddress(address)

    // 태그 처리
    const tagsString = formData.get('tags') as string
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : []

    // 이미지 업로드 처리 (압축된 이미지 사용)
    const images: string[] = []
    const imageFiles = formData.getAll('images') as File[]
    
    console.log('총 이미지 파일 수:', imageFiles.length)
    
    // 압축된 이미지가 있는지 확인
    const validImageFiles = imageFiles.filter(file => file && file.size > 0)
    console.log('유효한 이미지 파일 수:', validImageFiles.length)
    
    if (validImageFiles.length === 0) {
      console.log('이미지 파일 없음!')
      return json({ 
        error: '최소 1장의 이미지를 업로드해야 합니다.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 압축된 이미지들을 업로드
    for (const file of validImageFiles) {
      try {
        console.log(`이미지 업로드 시작: ${file.name} (${file.size} bytes)`)
        const imageUrl = await uploadPlaceImage(request, file)
        console.log(`이미지 업로드 성공: ${imageUrl}`)
        images.push(imageUrl)
      } catch (uploadError) {
        console.error('이미지 업로드 실패:', uploadError)
        // 이미지 업로드 오류 처리
        return json({ 
          error: '이미지 업로드 중 오류가 발생했습니다.',
          values: Object.fromEntries(formData)
        }, { status: 400 })
      }
    }

    console.log('업로드된 이미지 URLs:', images)

    // 별점 처리
    const rating = parseFloat(formData.get('rating') as string)
    if (!rating || rating < 0.5 || rating > 5) {
      return json({ 
        error: '별점을 선택해주세요 (0.5 ~ 5.0점)',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 시간대 정보 처리
    const selectedTimeSlot = formData.get('selectedTimeSlot') ? parseInt(formData.get('selectedTimeSlot') as string) : undefined
    const selectedPeriod = formData.get('selectedPeriod') as 'weekday' | 'weekend' | undefined

    // 필수 필드 검증
    const categoryIdValue = formData.get('category_id')
    if (!categoryIdValue) {
      return json({ 
        error: '카테고리를 선택해주세요.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    const categoryId = parseInt(categoryIdValue as string)
    if (isNaN(categoryId)) {
      return json({ 
        error: '유효하지 않은 카테고리입니다.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 장소 데이터 구성
    const placeData = {
      placeName,
      regionName,
      address,
      latitude,
      longitude,
      category_id: categoryId,
      description: formData.get('description') as string,
      rating,
      tags,
      images,
      selectedTimeSlot,
      selectedPeriod
    }

    console.log('장소 데이터:', placeData)

    // 장소 생성
    console.log('createUserPlaceFromLocation 호출 시작')
    await createUserPlaceFromLocation(request, placeData)
    console.log('장소 생성 완료!')

    return redirect(ROUTES.MY_PLACES)
  } catch (error) {
    console.error('=== 장소 등록 에러 ===')
    console.error('Error object:', error)
    console.error('Error message:', error instanceof Error ? error.message : error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // 장소 생성 오류 처리
    return json({ 
      error: error instanceof Error ? error.message : '장소 등록 중 오류가 발생했습니다.',
      values: Object.fromEntries(formData)
    }, { status: 400 })
  }
}

export default function RegisterPlace() {
  const { categories, todayCount, timeSlots, prefilledName } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const fetcher = useFetcher()
  const isSubmitting = navigation.state === 'submitting' || fetcher.state === 'submitting'
  
  // 지도에서 선택된 위치 정보
  const [selectedLocation, setSelectedLocation] = useState<PlaceLocationData | null>(null)
  
  // 압축된 이미지 파일들
  const [compressedImages, setCompressedImages] = useState<File[]>([])
  
  // 별점
  const [rating, setRating] = useState<number>(
    actionData?.values?.rating ? parseFloat(actionData.values.rating as string) : 0
  )

  // 운영시간 UI용 상태
  const [selectedPeriod, setSelectedPeriod] = useState<'weekday' | 'weekend'>('weekday')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
  
  // 카테고리 선택 상태
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | null>(
    actionData?.values?.category_id ? String(actionData.values.category_id) : null
  )

  // 카테고리 옵션 변환
  const categoryOptions: DropdownOption[] = categories.map(category => ({
    value: String(category.id),
    label: category.name,
    icon: category.icon || '',
    description: category.description || undefined
  }))

  const selectTimeSlot = (timeSlotId: number) => {
    setSelectedTimeSlot(selectedTimeSlot === timeSlotId ? null : timeSlotId)
  }

  // 일일 제한 체크
  if (todayCount >= 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <PageHeader title="장소 등록" />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              오늘 등록 가능한 장소 수를 초과했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              하루 최대 3개까지만 장소를 등록할 수 있습니다. (오늘 등록: {todayCount}/3)
              <br />
              내일 다시 시도해주세요.
            </p>
            <Link to={ROUTES.MY_PLACES}>
              <Button>내 장소 목록 보기</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // 커스텀 Form 제출 핸들러
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const form = event.currentTarget
    const formData = new FormData(form)
    
    // 압축된 이미지들을 FormData에 추가
    compressedImages.forEach((file, index) => {
      formData.append('images', file, `compressed-image-${index}.jpg`)
    })
    
    // Remix fetcher로 제출
    fetcher.submit(formData, {
      method: 'POST',
      encType: 'multipart/form-data'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <PageHeader 
        title="장소 등록"
        backLink={{
          to: ROUTES.HOME,
          text: "홈으로"
        }}
        rightContent={`오늘 등록: ${todayCount}/3`}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">새 장소 추천</h2>
            <p className="text-gray-600 mt-1">
              지도에서 장소를 선택하고 추천 정보를 입력해주세요!
            </p>
          </div>
          
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-6 space-y-6">
            {(actionData?.error || (fetcher.data as { error?: string })?.error) && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {actionData?.error || (fetcher.data as { error?: string })?.error}
              </div>
            )}

            {/* 위치 선택 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                위치 선택 <span className="text-red-500">*</span>
              </div>
              
              {/* 검색어로부터 온 경우 안내 메시지 */}
              {prefilledName && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600">💡</span>
                    <div>
                                             <p className="text-sm font-medium text-purple-800">
                         <span className="font-semibold">&ldquo;{prefilledName}&rdquo;</span> 장소를 등록하시나요?
                       </p>
                      <p className="text-xs text-purple-600 mt-1">
                        아래 지도에서 해당 장소를 검색하여 정확한 위치를 선택해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <ClientOnlyKakaoMap
                onLocationSelect={setSelectedLocation}
                height="400px"
                className="mb-4"
                initialSearchKeyword={prefilledName}
              />
              
              {/* 선택된 위치 정보를 hidden input으로 전송 */}
              <input
                type="hidden"
                name="placeName"
                value={selectedLocation?.placeName || ''}
              />
              <input
                type="hidden"
                name="address"
                value={selectedLocation?.address || ''}
              />
              <input
                type="hidden"
                name="latitude"
                value={selectedLocation?.latitude || 0}
              />
              <input
                type="hidden"
                name="longitude"
                value={selectedLocation?.longitude || 0}
              />
            </div>

            {/* 카테고리 */}
            <div>
              <Dropdown
                options={categoryOptions}
                selectedValue={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                label="카테고리"
                placeholder="카테고리를 선택하세요"
                required
                searchable
                variant="default"
              />
              {/* Form 전송용 hidden input */}
              {selectedCategoryId && (
                <input
                  type="hidden"
                  name="category_id"
                  value={selectedCategoryId}
                />
              )}
            </div>

            {/* 별점 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                장소 평점 <span className="text-red-500">*</span>
              </div>
              <div className="flex items-center gap-4">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size="md"
                />
                <div className="text-sm text-gray-600">
                  <span className="font-medium">선택한 평점:</span> {rating.toFixed(1)}점 / 5.0점
                </div>
              </div>
              <input type="hidden" name="rating" value={rating} />
              <p className="text-xs text-gray-500 mt-2">
                이 장소에 대한 평가를 선택해주세요
              </p>
            </div>

            {/* 운영시간 정보 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                운영시간 정보
              </div>
              <div className="text-sm text-amber-600 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>직접 갔었던 시간대를 입력해주세요</span>
              </div>

              {/* 방문 시기 */}
              <div className="mb-4">
                <div className="block text-sm font-medium text-gray-700 mb-2">방문 시기</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('weekday')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedPeriod === 'weekend'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    주말 (토-일)
                  </button>
                </div>
              </div>

              {/* 방문했던 시간대 */}
              <div className="mb-4">
                <div className="block text-sm font-medium text-gray-700 mb-2">방문했던 시간대</div>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((timeSlot) => (
                    <button
                      key={timeSlot.id}
                      type="button"
                      onClick={() => selectTimeSlot(timeSlot.id)}
                      className={`p-3 text-sm font-medium rounded-lg border text-left transition-colors ${
                        selectedTimeSlot === timeSlot.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium">{timeSlot.id}. {timeSlot.name}</div>
                    </button>
                  ))}
                </div>
                {selectedTimeSlot && (
                  <div className="mt-2 text-sm text-gray-600">
                    선택된 시간대: {selectedTimeSlot}번
                  </div>
                )}
              </div>

              {/* 선택된 정보를 hidden input으로 전송 */}
              {selectedTimeSlot && (
                <input type="hidden" name="selectedTimeSlot" value={selectedTimeSlot} />
              )}
              <input type="hidden" name="selectedPeriod" value={selectedPeriod} />
            </div>

            {/* 한줄 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                한줄 추천 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="예: 데이트 마무리로 야경 보며 맥주 한잔하기 좋아요!"
                defaultValue={actionData?.values?.description as string}
              />
            </div>

            {/* 태그 */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                태그 (최대 5개, 쉼표로 구분)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="예: 감성카페, 야경맛집, 산책코스"
                defaultValue={actionData?.values?.tags as string}
              />
              <p className="text-xs text-gray-500 mt-1">
                다른 사람들이 찾기 쉽도록 해시태그를 입력해주세요
              </p>
            </div>

            {/* 이미지 업로드 */}
            <ImageUpload
              name="images"
              label="사진 (1-3장)"
              required
              maxFiles={3}
              onFilesChange={setCompressedImages}
            />

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link to={ROUTES.HOME}>
                <Button variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedLocation || compressedImages.length === 0 || rating === 0}
              >
                {isSubmitting ? '등록 중...' : '장소 등록'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}