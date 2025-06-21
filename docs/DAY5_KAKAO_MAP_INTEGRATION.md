# DAY 5: 카카오 지도 API 연동

## 📋 기능 개요

유저가 장소를 등록할 때 카카오 지도 API와 연동하여 위치 정보(위도/경도)를 정확하게 수집하는 기능을 구현합니다.

## 🔄 구현된 기능

### 1단계: 환경 설정 완료

#### 1-1. 환경 변수 추가
- **위치**: `app/config/env.ts`
- **추가된 변수**: `KAKAO_MAP_APP_KEY`
- **용도**: 카카오 지도 JavaScript SDK 인증

#### 1-2. TypeScript 타입 정의
- **위치**: `app/types/kakao-map.ts`
- **포함 내용**:
  - 카카오 지도 API 인터페이스
  - 위치 데이터 타입
  - 검색 결과 타입

#### 1-3. 카카오 지도 SDK 유틸리티
- **위치**: `app/lib/kakao-map.client.ts`
- **기능**:
  - SDK 동적 로딩
  - 주소 ↔ 좌표 변환
  - 장소 검색
  - 기본 서울 중심 좌표 제공

#### 1-4. 데이터베이스 스키마 업데이트
- **위치**: `supabase/migrations/20240730000000_add_location_fields.sql`
- **변경사항**:
  - `places` 테이블에 `latitude`, `longitude` 필드 추가
  - 위치 기반 쿼리를 위한 인덱스 추가
  - 필드 설명 추가

#### 1-5. 데이터베이스 타입 정의 업데이트
- **위치**: `app/types/database.types.ts`
- **변경사항**: `latitude`, `longitude` 필드를 nullable로 설정

## 🔧 설치 및 설정

### 1. 카카오 개발자 계정 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 생성 또는 기존 앱 선택
3. **플랫폼 설정**:
   - Web 플랫폼 추가
   - 도메인 등록 (개발: `http://localhost:3000`, 운영: 실제 도메인)
4. **JavaScript 키 확인**:
   - 앱 설정 > 앱 키 > JavaScript 키 복사

### 2. 환경 변수 설정

`.env` 파일에 카카오 지도 API 키 추가:

```env
# 기존 환경 변수들...

# 카카오 지도 API 설정
KAKAO_MAP_APP_KEY=your_javascript_key_here
```

### 3. 마이그레이션 적용

```bash
# 개발 환경에서 마이그레이션 적용
npx supabase db reset --linked

# 또는 새 마이그레이션만 적용
npx supabase db push
```

## 🛠️ 기술적 구현 세부사항

### 1. SDK 동적 로딩 시스템

```typescript
// 카카오 지도 SDK를 필요할 때만 로드
export function loadKakaoMapSDK(): Promise<void> {
  // 중복 로드 방지
  if (isKakaoMapLoaded) return Promise.resolve()
  
  // 스크립트 태그 동적 생성
  const script = document.createElement('script')
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${env.KAKAO_MAP_APP_KEY}&libraries=services`
  
  // Promise 기반 로드 완료 처리
  return new Promise((resolve, reject) => {
    script.onload = () => resolve()
    script.onerror = () => reject()
    document.head.appendChild(script)
  })
}
```

### 2. 주소-좌표 변환 시스템

```typescript
// 주소를 위도/경도로 변환
export async function addressToCoords(address: string): Promise<KakaoLatLng | null> {
  await loadKakaoMapSDK()
  
  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) })
      } else {
        resolve(null)
      }
    })
  })
}
```

### 3. 데이터베이스 스키마 확장

```sql
-- 위치 정보 필드 추가
ALTER TABLE places 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- 위치 기반 검색을 위한 인덱스
CREATE INDEX idx_places_location ON places(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

## 🎯 다음 단계 계획

### 2단계: 지도 컴포넌트 구현
- React 기반 카카오 지도 컴포넌트
- 마커 표시 및 드래그 기능
- 줌 레벨 조정 및 중심점 이동

### 3단계: 장소 검색 인터페이스
- 키워드 기반 장소 검색
- 검색 결과 목록 표시
- 선택한 장소의 상세 정보 표시

### 4단계: 장소 등록 페이지 개선
- 기존 주소 입력을 지도 선택으로 교체
- 위도/경도 자동 수집
- 주소 정보 자동 입력

### 5단계: 위치 기반 기능 확장
- 거리 기반 장소 추천
- 지역별 장소 필터링
- 지도에서 장소 위치 표시

## 🚨 주의사항

1. **API 키 보안**: JavaScript 키는 클라이언트에 노출되므로 도메인 제한 설정 필수
2. **사용량 제한**: 카카오 지도 API 무료 할당량 확인 및 모니터링
3. **브라우저 호환성**: 구형 브라우저에서의 지도 API 동작 확인
4. **에러 처리**: 네트워크 오류, API 제한 등 예외 상황 대응

## 📊 성공 지표

- ✅ 카카오 지도 API 키 설정 완료
- ✅ TypeScript 타입 정의 완료
- ✅ SDK 동적 로딩 시스템 구현
- ✅ 주소-좌표 변환 함수 구현
- ✅ 데이터베이스 스키마 확장 완료
- ⏳ 지도 컴포넌트 구현 (2단계)
- ⏳ 장소 검색 인터페이스 구현 (3단계)
- ⏳ 장소 등록 페이지 개선 (4단계)

---

**현재 진행 상황**: 1단계 환경 설정 완료 ✅  
**다음 단계**: 2단계 지도 컴포넌트 구현 시작 