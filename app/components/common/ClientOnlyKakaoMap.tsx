import { useState, useEffect } from 'react'
import type { PlaceLocationData } from '~/types/kakao-map'

interface ClientOnlyKakaoMapProps {
  onLocationSelect: (location: PlaceLocationData) => void
  initialLocation?: PlaceLocationData
  height?: string
  className?: string
  initialSearchKeyword?: string
}

export default function ClientOnlyKakaoMap(props: ClientOnlyKakaoMapProps) {
  const [KakaoMapComponent, setKakaoMapComponent] = useState<React.ComponentType<ClientOnlyKakaoMapProps> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') {
      return
    }

    const loadKakaoMap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // 동적으로 KakaoMap 컴포넌트 임포트
        const { default: KakaoMap } = await import('./KakaoMap')
        
        setKakaoMapComponent(() => KakaoMap)
        
      } catch (err) {
        console.error('지도 컴포넌트 로딩 실패:', err)
        setError('지도 컴포넌트를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadKakaoMap()
  }, [])

  // 서버 사이드 렌더링 중에는 로딩 표시
  if (typeof window === 'undefined') {
    return (
      <div className={`h-[300px] bg-gray-100 rounded-lg flex items-center justify-center ${props.className || ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">서버 렌더링 중...</p>
        </div>
      </div>
    )
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className={`h-[300px] bg-gray-100 rounded-lg flex items-center justify-center ${props.className || ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">지도 컴포넌트 로딩 중...</p>
        </div>
      </div>
    )
  }

  // 에러 발생
  if (error) {
    return (
      <div className={`h-[300px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center ${props.className || ''}`}>
        <div className="text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  // 컴포넌트 로딩 완료
  if (KakaoMapComponent) {
    return <KakaoMapComponent {...props} />
  }

  // 기본 로딩 상태
  return (
    <div className={`h-[300px] bg-gray-100 rounded-lg flex items-center justify-center ${props.className || ''}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
        <p className="text-gray-600">준비 중...</p>
      </div>
    </div>
  )
} 