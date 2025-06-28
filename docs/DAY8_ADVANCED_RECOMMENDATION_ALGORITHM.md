 # DAY8: 고급 추천 알고리즘 시스템 개발

## 📋 개발 목표

코스모스 플랫폼의 핵심 기능인 **지능형 데이트 코스 추천 알고리즘**을 고도화하여 사용자 경험을 극대화하고 개인화된 추천 서비스를 제공합니다.

## 🎯 주요 기능 요구사항

### 1. 다단계 필터링 시스템
- **지역 기반 필터링**: 사용자 선택 지역 내 활성 장소만 조회
- **시간대 적합성 필터링**: 선택한 시간대에 운영하는 장소 우선 선별
- **활성 상태 검증**: `is_active = true`인 장소만 추천 대상에 포함

### 2. 위치 기반 중복 제거 시스템
- **GPS 좌표 그룹화**: 100m 반경 내 동일 장소 통합 처리
- **대표 장소 선정**: 그룹 내 최적 장소를 대표로 선택
  - 우선순위: admin 등록 > 높은 평점 > 최신 등록
- **그룹 크기 고려**: 동일 위치 등록 수를 인기도 지표로 활용

### 3. 스마트 스코어링 시스템
총 100점 만점의 세분화된 점수 체계:

| 평가 항목 | 최대 점수 | 세부 기준 |
|-----------|-----------|-----------|
| **제휴 여부** | 30점 | 파트너십 체결 업체 우대 |
| **평점** | 25점 | 5점 만점 기준 비례 환산 |
| **시간대 적합성** | 20점 | 사용자 선택 시간대 우선순위 기반 |
| **인기도** | 15점 | 동일 위치 등록 수 × 3점 (최대 15점) |
| **등록 소스** | 10점 | admin 등록 장소 추가 점수 |

### 4. 카테고리 다양성 보장
- **다양성 가중치 적용**: 동일 카테고리 집중 방지 (기본값: 0.3)
- **카테고리별 균등 분배**: 최대 12개 추천 중 다양한 카테고리 포함
- **라운드 로빈 방식**: 각 카테고리에서 순차적으로 선별

### 5. 성능 최적화 및 모니터링
- **실행 시간 추적**: 알고리즘 성능 모니터링
- **필터링 단계별 통계**: 각 단계별 장소 수 변화 추적
- **메타데이터 제공**: 추천 근거 및 과정 투명성 확보

## 🏗️ 시스템 아키텍처

### 모듈 구조
```
app/lib/recommendation/
├── types.ts           # 타입 정의
├── grouping.ts        # 위치 기반 그룹화
├── scoring.ts         # 점수 계산 로직
├── diversity.ts       # 다양성 보장 알고리즘
└── index.ts          # 메인 추천 엔진
```

### 데이터 플로우
1. **요청 수신** → `AdvancedRecommendationRequest`
2. **기본 필터링** → 지역/시간대/활성상태 조건 적용
3. **위치 그룹화** → GPS 기반 중복 장소 통합
4. **점수 계산** → 5개 항목 종합 스코어링
5. **다양성 적용** → 카테고리별 균형 조정
6. **최종 정렬** → 상위 12개 선별 반환

## 🔧 기술 세부사항

### 위치 그룹화 알고리즘
```typescript
// 100m 반경 내 동일 장소 판정
const locationKey = `${Math.round(lat * 1000) / 1000}_${Math.round(lng * 1000) / 1000}`
```

### 스코어링 공식
```typescript
totalScore = partnershipScore(30) + ratingScore(25) + 
             timeSlotScore(20) + popularityScore(15) + sourceScore(10)
```

### 다양성 페널티 적용
```typescript
adjustedScore = originalScore - (categoryCount * diversityWeight * 10)
```

## 📊 예상 성능 지표

### 응답 시간 목표
- **평균 응답 시간**: < 200ms
- **최대 응답 시간**: < 500ms
- **동시 요청 처리**: 100 RPS

### 추천 품질 목표
- **카테고리 다양성**: 최소 3개 이상 카테고리 포함
- **제휴 업체 비율**: 30% 이상
- **평점 평균**: 4.0점 이상

## 🚀 개발 일정

### Phase 1: 핵심 알고리즘 구현 (2시간)
- [x] 타입 정의 및 인터페이스 설계
- [x] 위치 기반 그룹화 로직 구현
- [x] 스코어링 시스템 개발
- [x] 다양성 보장 알고리즘 구현

### Phase 2: 통합 및 최적화 (2시간)
- [x] 메인 추천 엔진 통합
- [x] 성능 모니터링 시스템 추가
- [x] 에러 핸들링 및 예외 처리
- [ ] 단위 테스트 작성

### Phase 3: API 연동 및 UI 구현 (3시간)
- [ ] Remix 액션/로더 연동
- [ ] 프론트엔드 추천 페이지 구현
- [ ] 사용자 피드백 수집 시스템
- [ ] A/B 테스트 환경 구축

## 🧪 테스트 시나리오

### 기능 테스트
1. **기본 추천**: 지역 + 시간대 조건으로 12개 장소 추천
2. **다양성 검증**: 서로 다른 카테고리 장소들 포함 확인
3. **스코어링 정확성**: 제휴 업체 우선 순위 확인
4. **중복 제거**: 동일 위치 장소 통합 처리 확인

### 성능 테스트
1. **대용량 데이터**: 1,000개 이상 장소 데이터로 성능 측정
2. **동시 요청**: 50개 동시 요청 처리 능력 검증
3. **메모리 사용량**: 알고리즘 실행 시 메모리 효율성 확인

## 📈 향후 확장 계획

### DAY9+: 개인화 추천
- 사용자 이용 이력 기반 선호도 학습
- 협업 필터링 알고리즘 도입
- 실시간 개인화 가중치 적용

### 머신러닝 도입
- 사용자 행동 패턴 분석
- 추천 클릭률 예측 모델
- 자동 파라미터 튜닝 시스템

### 실시간 최적화
- Redis 캐싱 시스템 도입
- 인기 장소 실시간 업데이트
- 지역별 트렌드 반영 시스템

## 🎯 성공 지표 (KPI)

### 사용자 만족도
- **추천 클릭률**: > 40%
- **실제 방문률**: > 15%
- **사용자 평점**: > 4.2/5.0

### 비즈니스 임팩트
- **제휴 업체 노출 증가**: 50%↑
- **사용자 체류 시간**: 30%↑
- **재방문율**: 25%↑

---

## 🎨 실제 구현 내용 (DAY8 완료)

### 1. 고급 추천 알고리즘 모듈 시스템

#### ✅ `app/lib/recommendation/types.ts`
- **AdvancedRecommendationRequest**: 추천 요청 인터페이스
- **PlaceScore**: 장소별 점수 및 세부 내역
- **LocationGroup**: 위치 기반 그룹화 데이터
- **RecommendationResponse**: 추천 결과 및 메타데이터

```typescript
export interface AdvancedRecommendationRequest {
  regionId: number
  date: string
  timeSlotIds: number[]
  maxResults?: number // 기본값: 12
  diversityWeight?: number // 기본값: 0.3
}
```

#### ✅ `app/lib/recommendation/grouping.ts`
- **위치 기반 그룹화**: 100m 반경(소수점 3자리) 내 장소 통합
- **대표 장소 선정**: admin 소스 → 높은 평점 → 최신 등록 순
- **그룹 관리**: 동일 위치 장소들의 효율적인 관리

```typescript
export function groupPlacesByLocation(places: any[]): LocationGroup[] {
  const locationGroups = new Map<string, any[]>()
  
  places.forEach((place) => {
    const lat = Math.round(place.latitude * 1000) / 1000
    const lng = Math.round(place.longitude * 1000) / 1000
    const locationKey = `${lat}_${lng}`
    // ... 그룹화 로직
  })
}
```

#### ✅ `app/lib/recommendation/scoring.ts`
- **5단계 스코어링 시스템**: 제휴(30) + 평점(25) + 시간대(20) + 인기도(15) + 소스(10)
- **세분화된 점수 계산**: 각 항목별 상세 점수 산출
- **투명한 점수 내역**: 점수 산출 근거 제공

```typescript
export function calculatePlaceScore(
  representative: any,
  group: any[],
  timeSlotIds: number[],
): PlaceScore {
  const scoreBreakdown = {
    partnership: hasPartnership ? 30 : 0,
    rating: ((representative.rating || 0) / 5) * 25,
    timeSlot: Math.min(timeSlotScore, 20),
    popularity: Math.min(group.length * 3, 15),
    source: hasAdminSource ? 10 : 0,
  }
}
```

#### ✅ `app/lib/recommendation/diversity.ts`
- **카테고리 다양성 보장**: 라운드 로빈 방식 장소 선별
- **다양성 페널티**: 동일 카테고리 집중 시 점수 차감
- **균형 잡힌 추천**: 카테고리별 최대 개수 제한

```typescript
export function ensureCategoryDiversity(
  scoredGroups: PlaceScore[],
  diversityWeight: number = 0.3,
): PlaceScore[] {
  // 카테고리별 분류 및 라운드 로빈 선별
  const diversityPenalty = currentCount * diversityWeight * 10
  const adjustedScore = place.score - diversityPenalty
}
```

#### ✅ `app/lib/recommendation.server.ts`
- **메인 추천 엔진**: `getAdvancedRecommendations` 함수
- **5단계 추천 파이프라인**: 필터링 → 그룹화 → 스코어링 → 다양성 → 정렬
- **성능 모니터링**: 실행 시간 및 단계별 통계 추적

```typescript
export async function getAdvancedRecommendations(
  request: Request,
  params: AdvancedRecommendationRequest,
): Promise<RecommendationResponse> {
  const startTime = Date.now()
  
  const rawPlaces = await fetchFilteredPlaces(request, params)
  const locationGroups = groupPlacesByLocation(rawPlaces)
  const scoredGroups = calculateGroupScores(locationGroups, params.timeSlotIds)
  const diversePlaces = ensureCategoryDiversity(scoredGroups, params.diversityWeight ?? 0.3)
  const finalRecommendations = finalizeRecommendations(diversePlaces, params.maxResults ?? 12)
  
  const endTime = Date.now()
  
  return { places: finalRecommendations, metadata: { /* 상세 통계 */ } }
}
```

### 2. 별점 평가 시스템

#### ✅ `app/components/forms/StarRating.tsx`
- **정밀한 평점 입력**: 0.5점 단위 평가 (0.5~5.0점)
- **직관적인 UI/UX**: 마우스 드래그 및 클릭 지원
- **접근성 강화**: 키보드 네비게이션 (화살표 키, Home/End)
- **시각적 피드백**: 호버/선택 상태 실시간 표시
- **반응형 디자인**: 3가지 크기 (sm/md/lg) 지원

```typescript
export function StarRating({ value, onChange, size = 'md', disabled = false }: StarRatingProps) {
  const calculateRatingFromPosition = (clientX: number): number => {
    // 마우스 위치 기반 정밀한 평점 계산
    const positionInStar = (x % starWidth) / starWidth
    const rating = positionInStar < 0.5 ? starIndex - 0.5 : starIndex
    return Math.max(0.5, Math.min(5, rating))
  }
}
```

**주요 기능:**
- 마우스 드래그로 연속적인 평점 조정
- 반쪽/전체 별 표시로 직관적인 피드백
- 읽기 전용 모드 (장소 목록 표시용)
- 실시간 평점 값 표시

### 3. 장소 등록 시 평점/운영시간 입력

#### ✅ `app/routes/register-place.tsx` 개선사항

**별점 입력 섹션:**
```typescript
{/* 별점 */}
<div>
  <div className="block text-sm font-medium text-gray-700 mb-3">
    장소 평점 <span className="text-red-500">*</span>
  </div>
  <div className="flex items-center gap-4">
    <StarRating value={rating} onChange={setRating} size="md" />
    <div className="text-sm text-gray-600">
      <span className="font-medium">선택한 평점:</span> {rating.toFixed(1)}점 / 5.0점
    </div>
  </div>
</div>
```

**운영시간 정보 입력:**
```typescript
{/* 운영시간 정보 */}
<div>
  <div className="block text-sm font-medium text-gray-700 mb-3">운영시간 정보</div>
  <div className="text-sm text-amber-600 mb-4">💡 직접 갔었던 시간대를 입력해주세요</div>
  
  {/* 평일/주말 선택 */}
  <div className="mb-4">
    <div className="flex gap-2">
      <button type="button" onClick={() => setSelectedPeriod('weekday')}
        className={selectedPeriod === 'weekday' ? 'bg-purple-600 text-white' : 'bg-gray-100'}>
        평일 (월-금)
      </button>
      <button type="button" onClick={() => setSelectedPeriod('weekend')}
        className={selectedPeriod === 'weekend' ? 'bg-purple-600 text-white' : 'bg-gray-100'}>
        주말 (토-일)
      </button>
    </div>
  </div>
  
  {/* 시간대 선택 */}
  <div className="grid grid-cols-2 gap-3">
    {timeSlots.map((timeSlot) => (
      <button key={timeSlot.id} type="button" 
        onClick={() => selectTimeSlot(timeSlot.id)}
        className={selectedTimeSlot === timeSlot.id ? 'bg-purple-600 text-white' : 'bg-white'}>
        <div className="font-medium">{timeSlot.id}. {timeSlot.name}</div>
      </button>
    ))}
  </div>
</div>
```

**검증 로직 강화:**
- 별점 필수 입력 (0.5~5.0점 범위)
- 위치 선택 필수
- 이미지 최소 1장 업로드 필수
- 시간대 정보 선택 권장

### 4. 내 장소 관리에서 평점/운영시간 수정

#### ✅ `app/routes/my-places.tsx` 개선사항

**기존 평점 표시:**
```typescript
{place.rating && (
  <div className="flex items-center text-xs text-gray-500">
    <span className="font-medium">평점:</span>
    <div className="ml-2 flex items-center gap-1">
      <StarRating value={place.rating} onChange={() => {}} size="sm" disabled={true} />
      <span className="text-yellow-600 font-medium">{place.rating.toFixed(1)}점</span>
    </div>
  </div>
)}
```

**수정 모달 UI:**
```typescript
{editingPlace && (
  <Modal isOpen={true} onClose={() => setEditingPlace(null)} title={`${editingPlace.name} 수정`}>
    <div className="space-y-6">
      {/* 별점 수정 */}
      <div>
        <div className="block text-sm font-medium text-gray-700 mb-3">장소 평점</div>
        <StarRating value={rating} onChange={setRating} size="md" />
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
          <span className="font-medium">현재 평점:</span> {rating.toFixed(1)}점 / 5.0점
        </div>
      </div>
      
      {/* 운영시간 수정 */}
      <div>
        <div className="block text-sm font-medium text-gray-700 mb-3">운영시간 정보</div>
        {/* 평일/주말 및 시간대 선택 UI */}
      </div>
    </div>
  </Modal>
)}
```

**수정 기능:**
- 기존 평점 및 시간대 정보 로드
- 실시간 평점 조정
- 평일/주말 기간 변경
- 방문 시간대 업데이트
- 수정 내역 즉시 반영

### 5. 데이터베이스 연동 강화

#### ✅ `app/lib/user-places.server.ts` 개선
- **평점 정보 저장**: 장소 등록/수정 시 rating 필드 처리
- **시간대 정보 관리**: place_time_slots 테이블 연동
- **운영시간 생성**: start_time~end_time 형식 자동 변환

```typescript
// 시간대 정보가 있으면 운영시간을 start_time~end_time 형식으로 변환
if (selectedTimeSlot && selectedPeriod && timeSlot) {
  const operatingHours = {
    ...(existing?.operating_hours as Record<string, string> || {}),
    [selectedPeriod]: `${timeSlot.start_time}~${timeSlot.end_time}`
  }
  updateData.operating_hours = operatingHours
}
```

### 6. UI/UX 개선사항

**시각적 개선:**
- 별점 컴포넌트의 부드러운 애니메이션
- 시간대 선택 버튼의 직관적인 상태 표시
- 평점 실시간 표시 및 피드백
- 모달 기반의 깔끔한 수정 인터페이스

**사용자 경험 개선:**
- 평점 입력 필수화로 데이터 품질 향상
- 운영시간 정보로 추천 정확도 증대
- 기존 데이터 수정 기능으로 정보 최신화
- 직관적인 평일/주말 및 시간대 선택

**접근성 강화:**
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 명확한 라벨링 및 설명
- 시각적 피드백 강화

## 📋 DAY8 완료 요약

### ✅ 구현 완료 항목
1. **고급 추천 알고리즘 모듈 시스템** (4개 파일)
   - 타입 정의 (`types.ts`)
   - 위치 기반 그룹화 (`grouping.ts`)
   - 스코어링 시스템 (`scoring.ts`)
   - 다양성 보장 (`diversity.ts`)

2. **별점 평가 컴포넌트** (`StarRating.tsx`)
   - 0.5점 단위 정밀 입력
   - 마우스/키보드 지원
   - 접근성 강화

3. **장소 등록 시 평점/운영시간 입력**
   - 별점 필수 입력
   - 평일/주말 선택
   - 시간대 정보 입력

4. **내 장소 관리 개선**
   - 평점 표시 및 수정
   - 운영시간 정보 수정
   - 모달 기반 수정 UI

5. **데이터베이스 연동**
   - 평점 정보 저장/수정
   - 시간대 정보 관리
   - 운영시간 자동 변환

### 🔄 다음 단계 (DAY9+)
- 추천 알고리즘 API 엔드포인트 구현
- 메인 페이지에 고급 추천 시스템 적용
- 사용자 피드백 수집 시스템
- 추천 성능 모니터링 대시보드

---

*DAY8 개발이 성공적으로 완료되어 코스모스 플랫폼의 핵심 추천 엔진과 사용자 데이터 수집 시스템이 구축되었습니다.*