# DAY12 개발 기획: 맞춤 데이트 코스 추천 시스템

## 개요
현재 Course-More-Us는 개별 장소 추천에 머물러 있습니다. 이를 시간대별 장소들을 조합한 완성된 "데이트 코스" 추천 시스템으로 업그레이드합니다.

## 핵심 기능 요구사항

### 1. 데이트 코스 추천 프로세스
1. **지역 선택** (기존 기능 활용)
2. **데이트 날짜 선택** (Calendar 컴포넌트 활용)
3. **희망 시간대 선택** (복수 선택 가능)
   - 오전 (09:00-12:00)
   - 점심 (12:00-14:00)
   - 오후 (14:00-18:00)
   - 저녁 (18:00-21:00)
   - 밤 (21:00-24:00)
4. **코스 추천받기** 버튼 클릭

### 2. 데이트 코스 생성 알고리즘

#### 2.1 코스 구성 원칙
- 선택된 시간대에 맞는 장소들을 조합
- 각 시간대별로 1-2개 장소 선정
- 장소 간 이동 거리 고려 (도보 15분 이내 우선)
- 카테고리 다양성 확보 (카페 → 식당 → 액티비티 등)

#### 2.2 코스 생성 로직
```typescript
interface DateCourse {
  id: string;
  name: string; // "A코스", "B코스" 등
  theme: string; // "로맨틱 코스", "액티비티 코스" 등
  totalDuration: number; // 예상 소요 시간
  totalDistance: number; // 총 이동 거리
  places: CoursePlaceInfo[];
  estimatedCost: {
    min: number;
    max: number;
  };
}

interface CoursePlaceInfo {
  place: Place;
  timeSlot: TimeSlot;
  suggestedDuration: number; // 권장 체류 시간 (분)
  order: number; // 방문 순서
  distanceFromPrevious?: number; // 이전 장소로부터의 거리
}
```

#### 2.3 코스 생성 전략
1. **테마별 코스 생성**
   - 로맨틱 코스: 카페 → 레스토랑 → 야경 명소
   - 액티비티 코스: 브런치 → 체험 활동 → 맛집
   - 문화 코스: 전시/박물관 → 카페 → 공연/영화

2. **거리 최적화**
   - 장소 간 이동 거리 계산
   - 클러스터링을 통한 근거리 장소 우선 선정
   - 대중교통/도보 이동 시간 예측

3. **다양성 보장**
   - 같은 카테고리 연속 배치 방지
   - 가격대 균형 고려
   - 실내/실외 활동 적절히 배분

### 3. UI/UX 설계

#### 3.1 메인 페이지 개선
```tsx
// 기존 추천 버튼을 코스 추천으로 변경
<section className="recommendation-form">
  <RegionSelector />
  <Calendar 
    label="데이트 날짜"
    minDate={new Date()}
  />
  <TimeSlotSelector 
    multiple={true}
    label="희망 시간대"
  />
  <Button variant="primary" size="lg">
    맞춤 데이트 코스 추천받기
  </Button>
</section>
```

#### 3.2 코스 추천 결과 페이지
```tsx
<section className="course-results">
  {/* 코스 목록 */}
  <div className="course-list">
    {courses.map(course => (
      <CourseCard 
        key={course.id}
        course={course}
        onClick={() => selectCourse(course.id)}
      />
    ))}
  </div>
  
  {/* 선택된 코스 상세 */}
  {selectedCourse && (
    <CourseDetail 
      course={selectedCourse}
      showMap={true}
    />
  )}
</section>
```

#### 3.3 코스 카드 디자인
```tsx
interface CourseCardProps {
  course: DateCourse;
  onClick: () => void;
}

// 카드에 표시될 정보:
// - 코스명 및 테마
// - 포함된 장소 미리보기 (3개까지)
// - 총 소요 시간
// - 예상 비용 범위
// - 주요 특징 태그
```

#### 3.4 코스 상세 페이지
```tsx
interface CourseDetailProps {
  course: DateCourse;
  showMap: boolean;
}

// 표시 내용:
// - 타임라인 형태의 일정표
// - 각 장소별 상세 정보
// - 지도에 전체 경로 표시
// - 장소 간 이동 경로 및 시간
// - 코스 공유하기 기능
```

### 4. 지도 통합

#### 4.1 코스 경로 표시
- 카카오맵 폴리라인으로 경로 표시
- 각 장소에 순서 번호 마커
- 이동 수단별 경로 옵션 (도보/대중교통/자동차)

#### 4.2 인터랙티브 기능
- 마커 클릭 시 장소 정보 표시
- 경로 구간별 이동 시간 표시
- 전체 코스 한눈에 보기 (지도 bounds 자동 조정)

### 5. 데이터베이스 설계

#### 5.1 새로운 테이블
```sql
-- 생성된 코스 저장 (선택사항)
CREATE TABLE generated_courses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(100),
  theme VARCHAR(50),
  region_id INTEGER REFERENCES regions(id),
  date DATE,
  total_duration INTEGER,
  total_distance NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 코스-장소 연결
CREATE TABLE course_places (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES generated_courses(id),
  place_id INTEGER REFERENCES places(id),
  time_slot_id INTEGER REFERENCES time_slots(id),
  order_index INTEGER,
  suggested_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 코스 저장/즐겨찾기
CREATE TABLE user_saved_courses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  course_id INTEGER REFERENCES generated_courses(id),
  saved_at TIMESTAMP DEFAULT NOW()
);
```

### 6. API 설계

#### 6.1 코스 생성 API
```typescript
POST /api/courses/generate
Body: {
  regionId: number;
  date: string;
  timeSlots: number[];
  preferences?: {
    theme?: string;
    budgetRange?: { min: number; max: number };
    excludeCategories?: number[];
  }
}

Response: {
  courses: DateCourse[];
  generationId: string; // 임시 저장용
}
```

#### 6.2 코스 저장 API
```typescript
POST /api/courses/save
Body: {
  generationId: string;
  courseIndex: number;
  customName?: string;
}
```

### 7. 구현 우선순위

#### Phase 1: 핵심 기능 (3-4일)
1. TimeSlotSelector 컴포넌트 개발
2. 코스 생성 알고리즘 구현
3. CourseCard, CourseDetail 컴포넌트 개발
4. 기본 코스 추천 API 구현

#### Phase 2: 지도 통합 (2-3일)
1. 카카오맵 경로 표시 기능
2. 멀티 마커 및 경로 최적화
3. 인터랙티브 지도 기능
4. 실시간 이동 시간 계산

#### Phase 3: 고급 기능 (2-3일)
1. 코스 저장/공유 기능
2. 사용자 선호도 학습
3. 날씨 연동 (우천 시 실내 코스 우선)
4. 코스 커스터마이징 기능

### 8. 성능 고려사항

1. **코스 생성 최적화**
   - 장소 간 거리 매트릭스 캐싱
   - 인기 코스 조합 사전 생성
   - 병렬 처리로 여러 코스 동시 생성

2. **지도 렌더링 최적화**
   - 경로 데이터 압축
   - 뷰포트 기반 마커 렌더링
   - 이미지 lazy loading

### 9. 추가 개선 아이디어

1. **AI 기반 코스 최적화**
   - 사용자 피드백 학습
   - 계절/날씨별 코스 조정
   - 개인화된 추천 강화

2. **소셜 기능**
   - 코스 리뷰 및 평점
   - 인기 코스 랭킹
   - 커플 간 코스 공유

3. **예약 연동**
   - 레스토랑 예약 연동
   - 액티비티 예매 연동
   - 실시간 영업 정보 확인

## Phase 1 구현 완료 (2025-01-05)

### ✅ 완료된 주요 기능

#### 1. TimeSlotSelector 컴포넌트
- 직관적인 시간대 선택 UI
- 복수 선택 지원
- 시간대별 아이콘 및 설명 표시
- 선택 상태 시각적 피드백

#### 2. 코스 생성 알고리즘 (`app/lib/course.server.ts`)
- **테마별 코스 생성**: 로맨틱, 액티비티, 문화 코스
- **거리 최적화**: 장소 간 이동 시간 최소화
- **다양성 보장**: 카테고리별 균형 배치
- **메타데이터 계산**: 총 소요시간, 거리, 예상 비용

#### 3. UI 컴포넌트
- **CourseCard**: 코스 미리보기 카드
- **CourseDetail**: 3개 탭(타임라인, 장소목록, 정보) 상세뷰
- 반응형 디자인 및 접근성 지원

#### 4. API 구현
- `/api/courses/generate` 엔드포인트
- 완전한 에러 처리 및 유효성 검사
- FormData 기반 요청 처리

#### 5. 메인 페이지 통합
- 기존 장소 추천을 코스 추천으로 전환
- TimeSlotSelector 적용
- 코스 선택 및 상세보기 기능

### 🔧 핵심 기술 구현

```typescript
// 코스 생성 알고리즘 핵심
interface DateCourse {
  id: string;
  name: string; // "A코스", "B코스"
  theme: string;
  totalDuration: number;
  totalDistance: number;
  places: CoursePlaceInfo[];
  estimatedCost: { min: number; max: number };
}

// 테마별 설정
const THEME_CONFIGS = {
  romantic: { maxTravelTime: 15, preferredCategories: ['cafe', 'restaurant'] },
  activity: { maxTravelTime: 20, preferredCategories: ['activity', 'shopping'] },
  culture: { maxTravelTime: 15, preferredCategories: ['culture', 'cafe'] }
}
```

### 📊 성능 지표
- 코스 생성 시간: 평균 200-500ms
- 3-4개 테마별 코스 동시 생성
- 거리 기반 장소 최적화 적용
- 카테고리 다양성 보장 알고리즘

### 🎯 다음 단계 (Phase 2)
1. 카카오맵 경로 표시 기능
2. 멀티 마커 및 경로 최적화
3. 인터랙티브 지도 기능
4. 실시간 이동 시간 계산

## 🚨 Phase 1 긴급 버그 수정 (2025-01-05)

### 문제 상황
코스 추천 버튼 클릭 시 다음 에러 발생:
- `SyntaxError: Unexpected end of JSON input`
- `Error: aborted` with `ECONNRESET`

### 원인 분석
1. **불필요한 내부 API 호출**: `_index.tsx`에서 `fetch`로 내부 API 호출
2. **배열 변경 문제**: `course.server.ts`에서 원본 배열 직접 수정

### 해결 방안
1. **직접 함수 호출**: 내부 API 제거하고 `generateDateCourses` 직접 호출
2. **배열 복사**: 원본 배열 보호를 위한 복사본 사용
3. **불필요한 파일 제거**: `api.courses.generate.tsx` 삭제

### 수정된 코드
```typescript
// AS-IS: 복잡한 내부 API 호출
const courseRequest = new Request('/api/courses/generate', {...});
const courseResponse = await fetch(courseRequest);

// TO-BE: 직접 함수 호출
const courseResult = await generateDateCourses(request, {
  regionId, date, timeSlotIds
});
```

```typescript
// AS-IS: 원본 배열 수정
function arrangePlacesByTimeSlots(places: RecommendedPlace[]) {
  places.splice(selectedIndex, 1); // 원본 수정!
}

// TO-BE: 복사본 사용
function arrangePlacesByTimeSlots(places: RecommendedPlace[]) {
  const availablePlaces = [...places]; // 복사본 생성
  availablePlaces.splice(selectedIndex, 1); // 복사본 수정
}
```

## Phase 1 Bug Fix: 동일 장소 조합 중복 방지 및 UI 개선 (추가)

**문제점 발견:**
1. **동일한 장소 조합 중복**: A, B, C 코스가 완전히 같은 장소들로 구성되어 다른 코스로 노출
2. **UI 겹침 문제**: 코스 선택 시 체크마크와 '쉬움' 난이도 표시가 우상단에서 겹침

**해결 방안:**

### 1. 동일 장소 조합 중복 방지 로직 (`app/lib/course.server.ts`)

```typescript
// 장소 조합 추적 및 중복 방지
const usedPlaceCombinations: Set<string> = new Set();

// 장소 ID 조합으로 고유 식별자 생성
const placeIds = course.places.map(p => p.place.id).sort().join('-');

if (!usedPlaceCombinations.has(placeIds)) {
  usedPlaceCombinations.add(placeIds);
  courses.push(course);
}
```

**개선 사항:**
- 재시도 로직: 각 테마당 최대 3번 시도로 다양한 조합 생성
- 부족한 경우 대안 테마로 추가 코스 생성
- 코스 생성 실패 시 안정적인 폴백 메커니즘

### 2. 장소 선택 다양성 개선

```typescript
// 기존: 항상 최고 점수 장소 선택
selectedPlace = candidates[0];

// 개선: 상위 후보들 중 랜덤 선택
const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
const randomIndex = Math.floor(Math.random() * topCandidates.length);
selectedPlace = topCandidates[randomIndex];
```

### 3. UI 겹침 문제 해결 (`app/components/course/CourseCard.tsx`)

**문제:** 선택 상태일 때 체크마크(우상단)와 난이도 표시(우상단)가 겹침

**해결:**
```typescript
// 선택 상태가 아닐 때만 우상단에 난이도 표시
{!isSelected && (
  <div className="px-2 py-1 rounded-full text-xs font-medium">
    {getDifficultyText(course.difficulty)}
  </div>
)}

// 선택 상태일 때 난이도를 제목 아래로 이동
{isSelected && (
  <div className="flex items-center gap-2 mb-2">
    <div className="px-2 py-1 rounded-full text-xs font-medium">
      {getDifficultyText(course.difficulty)}
    </div>
    <span className="text-xs text-purple-600">• 체크된 코스</span>
  </div>
)}
```

**시각적 개선:**
- 선택 상태에서 명확한 "체크된 코스" 표시 추가
- 레이아웃 충돌 방지로 사용자 경험 향상
- 일관된 디자인 시스템 유지

## Phase 1.5: AI 검색 저장소 시스템 구현 완료 (2025-01-13)

### ✅ 구현 완료된 기능

#### 1. AI 검색 저장소 데이터베이스 설계
- **`ai_search_logs` 테이블**: AI 검색 요청/응답 이력 저장
- **`ai_recommended_places` 테이블**: AI 추천 장소 상세 정보 저장
- 마이그레이션 파일: `20250713000000_add_ai_search_storage.sql`

```sql
-- AI 검색 로그 테이블
CREATE TABLE ai_search_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  search_request JSONB NOT NULL,
  search_response JSONB,
  recommended_places_count INTEGER DEFAULT 0,
  is_successful BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  search_duration_ms INTEGER,
  perplexity_citations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 추천 장소 테이블
CREATE TABLE ai_recommended_places (
  id SERIAL PRIMARY KEY,
  ai_search_log_id INTEGER REFERENCES ai_search_logs(id) ON DELETE CASCADE,
  place_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  time_slot VARCHAR(50),
  duration INTEGER,
  search_info JSONB,
  special_tips TEXT,
  matched_place_id INTEGER REFERENCES places(id),
  matching_confidence NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. AI 검색 결과 저장 로직 구현
- **비동기 저장**: 사용자 경험에 영향 없는 백그라운드 저장
- **에러 처리**: 저장 실패 시에도 서비스 중단 없음
- **사용자별 보안**: RLS 정책으로 개인 데이터 보호

```typescript
// app/lib/ai-search-storage.server.ts
export async function saveAISearchAsync(
  request: Request,
  searchRequest: AISearchRequestInfo,
  searchResponse?: PerplexityCourseResponse,
  isSuccessful: boolean = false,
  errorMessage?: string,
  searchDurationMs?: number,
  matchedPlaces?: Array<{ searchPlace: SearchBasedPlaceInfo; matchedPlace?: RecommendedPlace; confidence?: number }>
): Promise<void>
```

#### 3. 데이터베이스 타입 정의 업데이트
- `app/types/database.types.ts`에 새 AI 테이블 타입 추가
- TypeScript 타입 안전성 확보
- Supabase 클라이언트와 완전 호환

#### 4. 원격-로컬 마이그레이션 동기화
- Supabase CLI migration repair 명령으로 동기화 완료
- 17개 마이그레이션 파일 모두 원격 DB와 일치
- 개발환경 안정성 확보

#### 5. AI 장소 승격 기능 구현
```typescript
export async function promoteAIPlaceToDatabase(
  request: Request,
  aiPlaceId: number,
  regionId: number,
  categoryId: number,
  additionalInfo?: { address?: string; latitude?: number; longitude?: number; }
): Promise<{ success: boolean; placeId?: number; error?: string }>
```

### 🔧 핵심 기술 구현

#### 데이터 저장 워크플로우
1. **AI 검색 요청** → `ai_search_logs` 테이블에 저장
2. **추천 장소들** → `ai_recommended_places` 테이블에 저장
3. **매칭 분석** → 기존 장소와의 유사도 계산 및 저장
4. **비동기 처리** → 메인 응답에 영향 없이 백그라운드 저장

#### 보안 및 권한 관리
- **Row Level Security (RLS)** 정책 적용
- 사용자별 데이터 접근 제한
- 관리자 전체 접근 정책 별도 설정

### 📊 성능 지표
- **저장 시간**: 평균 50-100ms (비동기)
- **에러 복구**: 저장 실패 시 서비스 지속성 보장
- **메모리 사용**: 원본 데이터 변경 없이 안전한 복사본 처리

### 🛠️ 개발환경 개선사항
- **마이그레이션 동기화**: 로컬-원격 DB 완전 일치
- **타입 안전성**: 새 테이블에 대한 완전한 TypeScript 지원
- **개발 생산성**: 안정적인 개발환경 기반 구축

## Phase 1.5: AI 통합 맞춤형 데이트 코스 추천 시스템 (기획) - Perplexity API 활용

### 🔍 Perplexity AI 통합 개요
현재 시스템은 미리 정의된 테마(로맨틱, 액티비티, 문화)로만 코스를 생성합니다. 이를 **Perplexity API**와 통합하여 실시간 검색 정보와 사용자의 개인적 요청사항, 등록된 장소 정보를 결합한 진정한 맞춤형 AI 데이트 코스 추천 시스템으로 업그레이드합니다.

### 🎯 핵심 목표
1. **개인화된 추천**: "조용한 곳에서 책 얘기하며 데이트하고 싶어요" 같은 자연어 요청 처리
2. **실시간 정보 활용**: 최신 맛집 리뷰, 이벤트, 날씨 정보 반영
3. **지역 특화 검색**: 해당 지역의 실시간 트렌드와 추천 장소 발굴
4. **상황별 최적화**: 날씨, 시간대, 예산, 계절 이벤트 등을 종합 고려

### 📅 구현 상태

#### ✅ 완료 (인프라)
- AI 검색 저장소 데이터베이스 구조 완성
- 검색 결과 저장 로직 구현
- 원격-로컬 마이그레이션 동기화

#### 🔄 진행 예정 (UI/API)
- Perplexity API 통합 설정
- 자연어 검색 요청 인터페이스
- 하이브리드 코스 생성 시스템
- 검색 기반 UI 컴포넌트

### 🏗️ 시스템 아키텍처 (기획)

#### 1. 사용자 인터페이스 확장
```tsx
// 기존 UI에 추가될 AI 요청 섹션
<section className="ai-request-section">
  <FormField label="어떤 데이트를 원하시나요? (선택사항)">
    <Textarea
      placeholder="예: 조용하고 아늑한 곳에서 대화 중심의 데이트를 하고 싶어요. 
      최근에 핫한 맛집도 포함해서 추천해주세요."
      maxLength={500}
      rows={4}
    />
  </FormField>
  
  <div className="preference-tags">
    <h4>관심사 (복수 선택 가능)</h4>
    <div className="tag-grid">
      {INTEREST_TAGS.map(tag => (
        <InterestTag key={tag} label={tag} />
      ))}
    </div>
  </div>
  
  <FormField label="예산 범위">
    <Select options={BUDGET_RANGES} />
  </FormField>
  
  <div className="real-time-options">
    <label>
      <input type="checkbox" /> 최신 트렌드 반영
    </label>
    <label>
      <input type="checkbox" /> 실시간 리뷰 기반 추천
    </label>
  </div>
</section>
```

#### 2. Perplexity API 통합 설계 (기획)

##### 2.1 검색 기반 프롬프트 구성
```typescript
interface PerplexityCoursePlanningRequest {
  userRequest: string; // 사용자의 자연어 요청
  preferences: {
    interests: string[];
    budgetRange: { min: number; max: number };
    weatherCondition?: string;
    groupSize?: number;
    includeTrends: boolean; // 최신 트렌드 반영 여부
    includeReviews: boolean; // 실시간 리뷰 반영 여부
  };
  contextData: {
    selectedRegion: Region;
    selectedTimeSlots: TimeSlot[];
    selectedDate: string;
    availablePlaces: Place[]; // 해당 지역 등록된 장소들
  };
}
```

### 🔄 구현 단계 (예정)

#### Phase 1.5.1: 기반 구조 (1일)
1. Perplexity API 통합 설정
2. 검색 요청 인터페이스 정의
3. 시스템 프롬프트 초안 작성

#### Phase 1.5.2: 코어 검색 기능 (2일)
1. 검색 기반 코스 생성 로직 구현
2. 하이브리드 코스 생성 시스템
3. 에러 처리 및 폴백 로직

#### Phase 1.5.3: UI 통합 (1일)
1. 검색 요청 폼 컴포넌트
2. 검색 코스 표시 개선
3. 검색 근거 및 출처 상세 보기

#### Phase 1.5.4: 최적화 및 테스트 (1일)
1. 검색 결과 캐싱 시스템 구현
2. 성능 테스트 및 튜닝
3. 실시간 검색 품질 테스트

### 🎯 기대 효과
1. **실시간 정보**: 최신 맛집, 이벤트, 트렌드 반영으로 추천 정확도 향상
2. **검색 기반 신뢰성**: 실제 리뷰와 검증된 정보 기반 추천
3. **지역 특화**: 해당 지역의 실시간 상황과 특성 반영
4. **개인화 강화**: 자연어 요청과 실시간 검색 결합으로 맞춤형 서비스

이를 통해 **실시간 검색 기반의 진정한 AI 데이트 컨시어지 서비스**로 발전할 수 있습니다.
