import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { useLoaderData, Form, useActionData, Link, useNavigation } from '@remix-run/react'
import { getRegions, getCategories } from '~/lib/admin.server'
import { createUserPlace, getTodayPlaceCount, uploadPlaceImage } from '~/lib/user-places.server'
import { Button, Input } from '~/components/ui'
import { ROUTES } from '~/constants/routes'
import { requireAuth } from '~/lib/auth.server'

export const meta: MetaFunction = () => {
  return [
    { title: '장소 등록 - 코스모스' },
    { name: 'description', content: '새로운 데이트 장소를 추천해주세요' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request)
  
  const [regions, categories, todayCount] = await Promise.all([
    getRegions(request),
    getCategories(request),
    getTodayPlaceCount(request)
  ])

  return json({ regions, categories, todayCount })
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request)
  
  const formData = await request.formData()

  try {
    // 일일 제한 체크
    const todayCount = await getTodayPlaceCount(request)
    if (todayCount >= 3) {
      return json({ 
        error: '하루 최대 3개까지만 장소를 등록할 수 있습니다.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 태그 처리
    const tagsString = formData.get('tags') as string
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : []

    // 이미지 업로드 처리
    const images: string[] = []
    const imageFiles = formData.getAll('images') as File[]
    
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        try {
          const imageUrl = await uploadPlaceImage(request, file)
          images.push(imageUrl)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
        }
      }
    }

    if (images.length === 0) {
      return json({ 
        error: '최소 1장의 이미지를 업로드해야 합니다.',
        values: Object.fromEntries(formData)
      }, { status: 400 })
    }

    // 장소 데이터 구성
    const placeData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      latitude: parseFloat(formData.get('latitude') as string) || 0,
      longitude: parseFloat(formData.get('longitude') as string) || 0,
      category_id: parseInt(formData.get('category_id') as string),
      region_id: parseInt(formData.get('region_id') as string),
      tags,
      images
    }

    // 장소 생성
    await createUserPlace(request, placeData)

    return redirect(ROUTES.MY_PLACES)
  } catch (error) {
    console.error('Error creating place:', error)
    return json({ 
      error: error instanceof Error ? error.message : '장소 등록 중 오류가 발생했습니다.',
      values: Object.fromEntries(formData)
    }, { status: 400 })
  }
}

export default function RegisterPlace() {
  const { regions, categories, todayCount } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // 일일 제한 체크
  if (todayCount >= 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">장소 등록</h1>
            </div>
          </div>
        </header>
        
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
              <h1 className="text-2xl font-bold text-gray-900">장소 등록</h1>
            </div>
            <div className="text-sm text-gray-500">
              오늘 등록: {todayCount}/3
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">새 장소 추천</h2>
            <p className="text-gray-600 mt-1">
              다른 커플들에게 추천하고 싶은 데이트 장소를 등록해보세요!
            </p>
          </div>
          
          <Form method="post" encType="multipart/form-data" className="p-6 space-y-6">
            {actionData?.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="장소명"
                  name="name"
                  required
                  placeholder="카페 이름, 레스토랑 이름 등"
                  defaultValue={actionData?.values?.name}
                />
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  defaultValue={actionData?.values?.category_id}
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-2">
                  지역 <span className="text-red-500">*</span>
                </label>
                <select
                  id="region_id"
                  name="region_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  defaultValue={actionData?.values?.region_id}
                >
                  <option value="">지역 선택</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 주소 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                주소 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="예: 서울특별시 강남구 테헤란로 427"
                defaultValue={actionData?.values?.address}
              />
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
                defaultValue={actionData?.values?.description}
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
                defaultValue={actionData?.values?.tags}
              />
              <p className="text-xs text-gray-500 mt-1">
                다른 사람들이 찾기 쉽도록 해시태그를 입력해주세요
              </p>
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                사진 (1-3장) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/*"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 3장까지 업로드 가능합니다. 장소의 분위기를 잘 보여주는 사진을 선택해주세요.
              </p>
            </div>

            {/* 위치 정보 (선택사항) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="위도 (선택사항)"
                  type="number"
                  name="latitude"
                  step="any"
                  placeholder="37.5665"
                  defaultValue={actionData?.values?.latitude}
                />
              </div>

              <div>
                <Input
                  label="경도 (선택사항)"
                  type="number"
                  name="longitude"
                  step="any"
                  placeholder="126.9780"
                  defaultValue={actionData?.values?.longitude}
                />
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link to={ROUTES.HOME}>
                <Button variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '등록 중...' : '장소 등록'}
              </Button>
            </div>
          </Form>
        </div>
      </main>
    </div>
  )
}