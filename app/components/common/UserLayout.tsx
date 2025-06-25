import { ReactNode } from 'react'
import { Link } from '@remix-run/react'
import { ROUTES } from '~/constants/routes'

interface UserLayoutProps {
  children: ReactNode
  title?: string
  backLink?: {
    to: string
    text?: string
  } | null
  showBackButton?: boolean
}

export function UserLayout({ 
  children, 
  title, 
  backLink = { to: ROUTES.MY_PROFILE, text: '마이 페이지' },
  showBackButton = true 
}: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {/* 헤더 (제목이 있는 경우) */}
      {title && (
        <div className="bg-white/10 backdrop-blur-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            {showBackButton && backLink && (
              <Link
                to={backLink.to}
                className="mr-4 text-white/90 hover:text-white transition-colors"
                aria-label="뒤로가기"
              >
                ←
              </Link>
            )}
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
        </div>
      )}
      
      {/* 컨텐츠 영역 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
} 