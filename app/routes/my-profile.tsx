import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, Link, Form, useActionData, useSubmit } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { requireAuth } from '~/lib/auth.server'
import { isAdmin } from '~/lib/admin.server'
import { getUserAgreements, toggleMarketingAgreement } from '~/lib/agreements.server'
import { getUserProfile } from '~/lib/profile.server'
import { createUserFeedback } from '~/lib/feedback.server'
import { Button, FeedbackModal, triggerCelebration } from '~/components/ui'

import { ROUTES } from '~/constants/routes'
import { formatDate } from '~/utils/date'

export const meta: MetaFunction = () => {
  return [
    { title: '마이 페이지 - 코스모스' },
    { name: 'description', content: '내 프로필 및 메뉴' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request)
  const userIsAdmin = await isAdmin(request)
  const agreements = await getUserAgreements(request)
  const profile = await getUserProfile(request)
  
  return json({ 
    user, 
    profile,
    isAdmin: userIsAdmin,
    marketingAgreed: agreements?.marketing_agreed ?? false,
    marketingAgreedAt: agreements?.marketing_agreed_at ?? null
  })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const action = formData.get('action')

  try {
    switch (action) {
      case 'toggleMarketing': {
        await toggleMarketingAgreement(request)
        return json({ success: true, message: '마케팅 수신 동의 설정이 변경되었습니다.' })
      }
      case 'sendFeedback': {
        const feedback = formData.get('feedback') as string
        if (!feedback?.trim()) {
          return json({ error: '피드백 내용을 입력해주세요.' }, { status: 400 })
        }
        await createUserFeedback(request, feedback.trim(), 'general')
        return json({ success: true, message: '피드백이 성공적으로 저장되었습니다. 소중한 의견 감사합니다!' })
      }
      default:
        return json({ error: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    console.error(error)
    return json({ 
      error: error instanceof Error ? error.message : '설정 변경 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export default function MyProfile() {
  const { user, profile, isAdmin: userIsAdmin, marketingAgreed, marketingAgreedAt } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()
  
  // 피드백 모달 상태
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleMarketingToggle = () => {
    const formData = new FormData()
    formData.append('action', 'toggleMarketing')
    submit(formData, { method: 'post' })
  }

  const handleFeedbackSubmit = (feedback: string) => {
    setIsSubmittingFeedback(true)
    const formData = new FormData()
    formData.append('action', 'sendFeedback')
    formData.append('feedback', feedback)
    submit(formData, { method: 'post' })
  }



  // 피드백 전송 완료 시 모달 닫기 및 폭죽 효과
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && isSubmittingFeedback) {
      setIsSubmittingFeedback(false)
      setIsFeedbackModalOpen(false)
      
      // 모달이 닫힌 후 폭죽 효과 실행
      triggerCelebration('feedback', { delay: 300 }) // 모달 닫힘 애니메이션 후
    }
  }, [actionData, isSubmittingFeedback])

  const menuItems = [
    {
      title: '내 정보 보기',
      description: '프로필 정보 확인 및 수정',
      icon: '👤',
      href: ROUTES.MY_INFO,
    },
    {
      title: '내 장소',
      description: '등록한 데이트 장소 관리',
      icon: '📍',
      href: ROUTES.MY_PLACES,
    },
    {
      title: '장소 등록',
      description: '새로운 데이트 장소 추천',
      icon: '➕',
      href: ROUTES.REGISTER_PLACE,
    },
    {
      title: '내 즐겨찾기',
      description: '즐겨찾기한 데이트 장소 확인',
      icon: '❤️',
      href: ROUTES.MY_FAVORITES,
    },
    ...(userIsAdmin ? [{
      title: '관리자',
      description: '시스템 관리 및 설정',
      icon: '⚙️',
      href: ROUTES.ADMIN,
    }] : []),
    {
      title: '피드백',
      description: '개발자에게 의견 보내기',
      icon: '💬',
      onClick: () => setIsFeedbackModalOpen(true),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {/* 헤더 */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link
            to={ROUTES.HOME}
            className="mr-4 text-white/90 hover:text-white transition-colors"
            aria-label="뒤로가기"
          >
            ←
          </Link>
          <h1 className="text-lg font-semibold text-white">마이 페이지</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">

        {/* 프로필 섹션 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  alt="프로필"
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl text-purple-600">👤</span>
                </div>
              )}
              {user.app_metadata?.provider === 'kakao' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">K</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {profile?.nickname || user.user_metadata?.full_name || '사용자'}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.app_metadata?.provider && (
                <p className="text-xs text-gray-400 mt-1">
                  {user.app_metadata.provider === 'kakao' ? '카카오' : 
                   user.app_metadata.provider === 'google' ? '구글' : 
                   user.app_metadata.provider} 계정
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 알림 메시지 */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 bg-green-100/90 backdrop-blur-sm border border-green-300 text-green-800 px-4 py-3 rounded-2xl shadow-lg">
            {actionData.message}
          </div>
        )}
        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 bg-red-100/90 backdrop-blur-sm border border-red-300 text-red-800 px-4 py-3 rounded-2xl shadow-lg">
            {actionData.error}
          </div>
        )}

        {/* 마케팅 동의 설정 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h3>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">마케팅 정보 수신</h4>
              <p className="text-sm text-gray-500 mt-1" id="marketing-description">
                새로운 데이트 코스나 이벤트 정보를 받아보실 수 있습니다.
              </p>
              {marketingAgreed && marketingAgreedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  동의 시점: {formatDate(new Date(marketingAgreedAt))}
                </p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer" aria-label="마케팅 정보 수신 동의 토글">
              <input
                type="checkbox"
                checked={marketingAgreed}
                onChange={handleMarketingToggle}
                className="sr-only peer"
                aria-describedby="marketing-description"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* 메뉴 섹션 */}
        <div className="space-y-3">
          {menuItems.map((item, index) => {
            const content = (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-xl">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="text-gray-400">
                  →
                </div>
              </div>
            )

            if ('href' in item && item.href) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200"
                >
                  {content}
                </Link>
              )
            } else if ('onClick' in item) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full text-left bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200"
                >
                  {content}
                </button>
              )
            }
            
            return null
          })}
        </div>

        {/* 로그아웃 버튼 */}
        <div className="mt-8">
          <Form method="post" action={ROUTES.LOGOUT}>
            <Button 
              type="submit" 
              variant="danger" 
              className="w-full rounded-2xl py-3"
            >
              로그아웃
            </Button>
          </Form>
        </div>
      </div>

      {/* 피드백 모달 */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isSubmittingFeedback}
      />
    </div>
  )
} 