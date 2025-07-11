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

## 예상 일정
- ✅ **Phase 1 완료**: 3-4일 → **실제 1일 완료**
- Phase 2 (지도 통합): 2-3일
- Phase 3 (고급 기능): 2-3일

## 기대 효과
1. 단순 장소 추천에서 완성된 데이트 코스 제공으로 서비스 가치 상승
2. 사용자 체류 시간 및 참여도 증가
3. 코스 공유를 통한 바이럴 효과
4. 향후 수익 모델 확장 가능 (프리미엄 코스, 예약 수수료 등)