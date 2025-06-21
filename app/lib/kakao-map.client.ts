import { env } from '~/config/env'
import type { KakaoLatLng, PlaceLocationData } from '~/types/kakao-map'

/**
 * 카카오 지도 SDK 로드 상태
 */
let isKakaoMapLoaded = false
let loadingPromise: Promise<void> | null = null

/**
 * 카카오 지도 SDK를 동적으로 로드합니다
 */
export function loadKakaoMapSDK(): Promise<void> {
  if (isKakaoMapLoaded) {
    return Promise.resolve()
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('카카오 지도는 브라우저 환경에서만 사용할 수 있습니다'))
      return
    }

    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      isKakaoMapLoaded = true
      resolve()
      return
    }

    // 스크립트 태그 생성
    if (!env.KAKAO_MAP_APP_KEY) {
      reject(new Error('카카오 지도 API 키가 설정되지 않았습니다. .env 파일에 VITE_KAKAO_MAP_APP_KEY를 추가해주세요.'))
      return
    }
    
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${env.KAKAO_MAP_APP_KEY}&libraries=services,clusterer,drawing&autoload=false`
    
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          isKakaoMapLoaded = true
          resolve()
        })
      } else {
        reject(new Error('카카오 지도 SDK 로드에 실패했습니다'))
      }
    }

    script.onerror = () => {
      reject(new Error('카카오 지도 SDK 스크립트 로드에 실패했습니다'))
    }

    document.head.appendChild(script)
  })

  return loadingPromise
}

/**
 * 주소를 좌표로 변환합니다
 */
export async function addressToCoords(address: string): Promise<KakaoLatLng | null> {
  await loadKakaoMapSDK()

  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder()
    
    geocoder.addressSearch(address, (result: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        resolve({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x)
        })
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * 좌표를 주소로 변환합니다
 */
export async function coordsToAddress(lat: number, lng: number): Promise<string | null> {
  await loadKakaoMapSDK()

  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder()
    
    geocoder.coord2Address(lng, lat, (result: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        resolve(result[0].address.address_name)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * 키워드로 장소를 검색합니다
 */
export async function searchPlaces(keyword: string): Promise<PlaceLocationData[]> {
  await loadKakaoMapSDK()

  return new Promise((resolve) => {
    const places = new window.kakao.maps.services.Places()
    
    places.keywordSearch(keyword, (data: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const results: PlaceLocationData[] = data.map(place => ({
          address: place.address_name,
          roadAddress: place.road_address_name,
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x),
          placeName: place.place_name
        }))
        resolve(results)
      } else {
        resolve([])
      }
    })
  })
}

/**
 * 기본 서울 중심 좌표
 */
export const DEFAULT_CENTER: KakaoLatLng = {
  lat: 37.5665,
  lng: 126.9780
} 