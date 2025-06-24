// 카카오 지도 API 타입 정의

declare global {
  interface Window {
    kakao: any;
  }
}

export interface KakaoLatLng {
  lat: number;
  lng: number;
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLng;
  map?: any;
  title?: string;
  image?: any;
}

export interface KakaoAddressResult {
  address_name: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  distance: string;
  id: string;
  phone: string;
  place_name: string;
  place_url: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
}

export interface KakaoSearchResult {
  documents: KakaoAddressResult[];
  meta: {
    is_end: boolean;
    pageable_count: number;
    same_name: {
      keyword: string;
      region: string[];
      selected_region: string;
    };
    total_count: number;
  };
}

export interface PlaceLocationData {
  address: string;
  roadAddress?: string;
  latitude: number;
  longitude: number;
  placeName?: string;
}

// 카카오 지도 SDK 메서드 타입
export interface KakaoMap {
  setCenter(latlng: any): void;
  setLevel(level: number): void;
  getCenter(): any;
  getLevel(): number;
}

export interface KakaoMarker {
  setPosition(latlng: any): void;
  setMap(map: any): void;
  getPosition(): any;
}

export interface KakaoGeocoder {
  addressSearch(address: string, callback: (result: any[], status: any) => void): void;
  coord2Address(lng: number, lat: number, callback: (result: any[], status: any) => void): void;
}

export interface KakaoPlaces {
  keywordSearch(keyword: string, callback: (data: KakaoAddressResult[], status: any, pagination: any) => void, options?: any): void;
  categorySearch(category: string, callback: (data: KakaoAddressResult[], status: any, pagination: any) => void, options?: any): void;
} 