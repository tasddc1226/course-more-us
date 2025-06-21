import { useEffect, useRef, useState } from 'react'
import { loadKakaoMapSDK, coordsToAddress, searchPlaces } from '~/lib/kakao-map.client'
import type { KakaoMap, KakaoMarker, PlaceLocationData } from '~/types/kakao-map'
import { Button, Input } from '~/components/ui'

interface KakaoMapComponentProps {
  onLocationSelect: (location: PlaceLocationData) => void
  initialLocation?: PlaceLocationData
  height?: string
  className?: string
}

export default function KakaoMapComponent({
  onLocationSelect,
  initialLocation,
  height = '400px',
  className = ''
}: KakaoMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<KakaoMap | null>(null)
  const [marker, setMarker] = useState<KakaoMarker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceLocationData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<PlaceLocationData | null>(initialLocation || null)

  // 지도 초기화
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 카카오 지도 SDK 로드
        await loadKakaoMapSDK()

        if (!mapRef.current) {
          return
        }

        // 지도 생성
        const mapOptions = {
          center: new window.kakao.maps.LatLng(
            initialLocation?.latitude || 37.5665,
            initialLocation?.longitude || 126.9780
          ),
          level: 3
        }

        const kakaoMap = new window.kakao.maps.Map(mapRef.current, mapOptions)

        // 마커 생성
        const kakaoMarker = new window.kakao.maps.Marker({
          position: mapOptions.center
        })
        kakaoMarker.setMap(kakaoMap)

        // 지도 클릭 이벤트
        window.kakao.maps.event.addListener(kakaoMap, 'click', async (mouseEvent: { latLng: { getLat(): number; getLng(): number } }) => {
          const latlng = mouseEvent.latLng
          const lat = latlng.getLat()
          const lng = latlng.getLng()

          // 마커 위치 업데이트
          kakaoMarker.setPosition(latlng)

          try {
            // 좌표를 주소로 변환
            const address = await coordsToAddress(lng, lat)
            const locationData: PlaceLocationData = {
              latitude: lat,
              longitude: lng,
              address: address || `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`
            }

            setSelectedLocation(locationData)
            onLocationSelect(locationData)
          } catch (error) {
            const locationData: PlaceLocationData = {
              latitude: lat,
              longitude: lng,
              address: `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`
            }
            setSelectedLocation(locationData)
            onLocationSelect(locationData)
          }
        })

        setMap(kakaoMap)
        setMarker(kakaoMarker)

        // 초기 위치가 있으면 주소 정보 설정
        if (initialLocation) {
          setSelectedLocation(initialLocation)
        }

      } catch (error) {
        console.error('지도 초기화 실패:', error)
        const errorMessage = error instanceof Error ? error.message : '지도를 불러오는데 실패했습니다.'
        setError(`지도 로딩 실패: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    }

    initMap()
  }, [initialLocation, onLocationSelect])

  // 장소 검색
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return

    try {
      setIsSearching(true)
      const results = await searchPlaces(searchKeyword)
      setSearchResults(results)
    } catch (error) {
      setError('장소 검색에 실패했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  // 검색 결과 선택
  const handleSelectSearchResult = (result: PlaceLocationData) => {
    if (!map || !marker) return

    const position = new window.kakao.maps.LatLng(result.latitude, result.longitude)

    // 지도 중심 이동
    map.setCenter(position)
    // 마커 위치 업데이트
    marker.setPosition(position)

    setSelectedLocation(result)
    onLocationSelect(result)
    setSearchResults([]) // 검색 결과 숨기기
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2"
          size="sm"
        >
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 검색 영역 */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="장소명 또는 주소로 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchKeyword.trim()}
            size="sm"
          >
            {isSearching ? '검색중...' : '검색'}
          </Button>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm">{result.placeName}</div>
                <div className="text-xs text-gray-500">
                  {result.roadAddress || result.address}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지도 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">지도 로딩중...</p>
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          style={{ height }}
          className="w-full rounded-lg border border-gray-200"
        />
      </div>

      {/* 선택된 위치 정보 */}
      {selectedLocation && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="font-medium text-sm text-gray-900 mb-2">선택된 위치</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>주소: {selectedLocation.address}</div>
            <div>
              좌표: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="text-xs text-gray-500">
        💡 지도를 클릭하거나 검색을 통해 장소를 선택하세요
      </div>
    </div>
  )
} 