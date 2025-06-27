import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, Form, useActionData, useSubmit, useFetcher } from '@remix-run/react'
import { requireAuth } from '~/lib/auth.server'
import { getUserProfile, updateUserProfile, isNicknameAvailable } from '~/lib/profile.server'
import { Button, Input } from '~/components/ui'
import { UserLayout } from '~/components/common'
import { ROUTES } from '~/constants/routes'
import { formatDate } from '~/utils/date'
import { useState, useEffect } from 'react'

export const meta: MetaFunction = () => {
  return [
    { title: '내 정보 - 코스모스' },
    { name: 'description', content: '내 프로필 정보 확인 및 수정' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request)
  const profile = await getUserProfile(request)
  
  return json({ 
    user, 
    profile
  })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const action = formData.get('action')

  try {
    switch (action) {
      case 'updateProfile': {
        const nickname = formData.get('nickname') as string
        if (!nickname?.trim()) {
          return json({ error: '닉네임을 입력해주세요.' }, { status: 400 })
        }
        await updateUserProfile(request, { nickname: nickname.trim() })
        return json({ success: true, message: '닉네임이 성공적으로 변경되었습니다.' })
      }
      case 'checkNickname': {
        const nickname = formData.get('nickname') as string
        if (!nickname?.trim()) {
          return json({ available: false, message: '닉네임을 입력해주세요.' })
        }
        const available = await isNicknameAvailable(request, nickname.trim())
        return json({ 
          available, 
          message: available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
          nickname: nickname.trim()
        })
      }
      default:
        return json({ error: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error) {
    console.error(error)
    return json({ 
      error: error instanceof Error ? error.message : '작업 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export default function MyInfo() {
  const { user, profile } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()
  const nicknameFetcher = useFetcher<typeof action>()
  
  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [isEditing, setIsEditing] = useState(false)
  const [nicknameStatus, setNicknameStatus] = useState<{
    available?: boolean
    message?: string
    checked?: boolean
  }>({})

  // profile이 변경될 때 nickname 상태 업데이트
  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname)
    }
  }, [profile?.nickname])

  // 닉네임 중복 확인
  const checkNickname = () => {
    if (!nickname.trim()) {
      setNicknameStatus({ available: false, message: '닉네임을 입력해주세요.' })
      return
    }
    
    if (nickname.trim() === profile?.nickname) {
      setNicknameStatus({ available: true, message: '현재 사용 중인 닉네임입니다.' })
      return
    }

    const formData = new FormData()
    formData.append('action', 'checkNickname')
    formData.append('nickname', nickname.trim())
    nicknameFetcher.submit(formData, { method: 'post' })
  }

  // 닉네임 체크 결과 업데이트
  useEffect(() => {
    if (nicknameFetcher.data && 'available' in nicknameFetcher.data) {
      setNicknameStatus({
        available: nicknameFetcher.data.available,
        message: nicknameFetcher.data.message,
        checked: true
      })
    }
  }, [nicknameFetcher.data])

  // 프로필 업데이트 성공 후 상태 초기화
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      setNicknameStatus({})
    }
  }, [actionData])

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nicknameStatus.available) {
      return
    }
    
    const formData = new FormData()
    formData.append('action', 'updateProfile')
    formData.append('nickname', nickname.trim())
    submit(formData, { method: 'post' })
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setNickname(profile?.nickname || '')
    setIsEditing(false)
    setNicknameStatus({})
  }

  const handleEditStart = () => {
    setIsEditing(true)
    setNicknameStatus({})
  }

  return (
    <UserLayout title="내 정보" backLink={{ to: ROUTES.MY_PROFILE }}>
        {/* 알림 메시지 */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {actionData.message}
          </div>
        )}
        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        {/* 프로필 정보 카드 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 text-center border-b border-gray-100">
            <div className="relative inline-block mb-4">
              {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  alt="프로필"
                  className="w-20 h-20 rounded-full mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <span className="text-3xl text-gray-400">👤</span>
                </div>
              )}
              {user.app_metadata?.provider === 'kakao' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">K</span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {profile?.nickname || user.user_metadata?.full_name || '사용자'}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>

          {/* 정보 섹션 */}
          <div className="divide-y divide-gray-100">
            {/* 이메일 */}
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <dt className="text-sm font-medium text-gray-900">이메일</dt>
                <dd className="text-sm text-gray-500 mt-1">{user.email}</dd>
              </div>
            </div>

            {/* 이름 */}
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <dt className="text-sm font-medium text-gray-900">이름</dt>
                <dd className="text-sm text-gray-500 mt-1">
                  {user.user_metadata?.full_name || '수구리'}
                </dd>
              </div>
            </div>

            {/* 닉네임 */}
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <dt className="text-sm font-medium text-gray-900">닉네임</dt>
                  {!isEditing && (
                    <dd className="text-sm text-gray-500 mt-1">
                      {profile?.nickname || '수굴림'}
                    </dd>
                  )}
                </div>
                {!isEditing && (
                  <button
                    onClick={handleEditStart}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    변경
                  </button>
                )}
              </div>

              {isEditing && (
                <form onSubmit={handleNicknameSubmit} className="space-y-3">
                  <div>
                    <Input
                      type="text"
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value)
                        setNicknameStatus({}) // 입력 시 상태 초기화
                      }}
                      placeholder="닉네임을 입력하세요"
                      maxLength={50}
                      required
                      className="w-full"
                    />
                    {nicknameStatus.message && (
                      <p className={`text-xs mt-1 ${
                        nicknameStatus.available ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {nicknameStatus.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={checkNickname}
                      variant="outline"
                      size="sm"
                      disabled={nicknameFetcher.state !== 'idle' || !nickname.trim()}
                      className="text-xs"
                    >
                      {nicknameFetcher.state !== 'idle' ? '확인 중...' : '중복 확인'}
                    </Button>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="text-xs"
                      disabled={!nicknameStatus.available}
                    >
                      저장
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={handleEditCancel}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* 가입일 */}
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <dt className="text-sm font-medium text-gray-900">가입일</dt>
                <dd className="text-sm text-gray-500 mt-1">
                  {formatDate(new Date(user.created_at || ''))}
                </dd>
              </div>
            </div>

            {/* 로그인 방법 */}
            {user.app_metadata?.provider && (
              <div className="px-6 py-4 flex justify-between items-center">
                <div>
                  <dt className="text-sm font-medium text-gray-900">로그인 방법</dt>
                  <dd className="text-sm text-gray-500 mt-1">
                    {user.app_metadata.provider === 'kakao' ? '카카오' : 
                     user.app_metadata.provider === 'google' ? '구글' : 
                     user.app_metadata.provider} 계정
                  </dd>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="bg-white rounded-lg shadow-sm">
          <Form method="post" action={ROUTES.LOGOUT}>
            <button
              type="submit"
              className="w-full px-6 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              로그아웃
            </button>
          </Form>
        </div>
    </UserLayout>
  )
} 