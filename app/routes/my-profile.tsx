import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, Link, Form } from '@remix-run/react'
import { requireAuth } from '~/lib/auth.server'
import { isAdmin } from '~/lib/admin.server'
import { Button } from '~/components/ui'
import { ROUTES } from '~/constants/routes'

export const meta: MetaFunction = () => {
  return [
    { title: '마이 페이지 - 코스모스' },
    { name: 'description', content: '내 프로필 및 메뉴' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request)
  const userIsAdmin = await isAdmin(request)
  
  return json({ user, isAdmin: userIsAdmin })
}

export default function MyProfile() {
  const { user, isAdmin: userIsAdmin } = useLoaderData<typeof loader>()

  const menuItems = [
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
    ...(userIsAdmin ? [{
      title: '관리자',
      description: '시스템 관리 및 설정',
      icon: '⚙️',
      href: ROUTES.ADMIN,
    }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link
            to={ROUTES.HOME}
            className="text-purple-600 hover:text-purple-700 mr-4"
          >
            ← 홈으로
          </Link>
          <h1 className="text-xl font-bold text-gray-900">마이 페이지</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
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
                {user.user_metadata?.full_name || '사용자'}
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

        {/* 메뉴 섹션 */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
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
            </Link>
          ))}
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
      </main>
    </div>
  )
} 