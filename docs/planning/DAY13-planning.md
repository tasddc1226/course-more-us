# DAY13 개발 계획 - Phase 2.1: 사용자 경험 향상

## 개요
DAY12까지 완료된 AI 기반 데이트 코스 추천 시스템을 바탕으로, 이제 사용자 경험을 획기적으로 개선하는 Phase 2.1을 시작합니다. 이번 단계에서는 개인화, 커스터마이징, 그리고 고급 필터링 기능을 구현합니다.

## 현재 시스템 분석

### 완료된 핵심 기능
- ✅ AI 기반 자연어 코스 검색
- ✅ 테마별 코스 생성 (로맨틱, 액티비티, 문화)
- ✅ 지도 기반 코스 시각화
- ✅ 하이브리드 코스 생성 시스템

### 개선이 필요한 영역
1. **개인화 부족**: 모든 사용자에게 동일한 추천
2. **커스터마이징 불가**: 생성된 코스 수정 불가능
3. **필터 부족**: 예산, 접근성 등 세부 옵션 없음
4. **피드백 미활용**: 사용자 선호도 학습 안됨

## Phase 2.1 상세 기획

### 1. 사용자 선호도 학습 시스템

#### 1.1 데이터 수집
- **암묵적 데이터**
  - 코스 조회 시간
  - 스크롤 패턴
  - 클릭 순서
  - 재방문 빈도

- **명시적 데이터**
  - 좋아요/싫어요
  - 장소별 평점
  - 실제 방문 기록
  - 코스 완료 후기

#### 1.2 선호도 프로필 구조
```typescript
interface UserPreferenceProfile {
  userId: string;
  preferences: {
    categories: Map<string, number>; // 카테고리별 선호도 점수
    priceRange: { min: number; max: number };
    timePreferences: TimeSlot[]; // 선호 시간대
    themes: ThemePreference[]; // 테마별 선호도
    accessibility: AccessibilityNeeds;
  };
  behaviorMetrics: {
    avgCourseCompletionRate: number;
    preferredCourseLength: number; // 선호 코스 장소 수
    avgSpendingPerCourse: number;
  };
  learningHistory: PreferenceLearningEvent[];
}
```

#### 1.3 학습 알고리즘
- **협업 필터링**: 유사한 사용자의 선호도 반영
- **컨텐츠 기반 필터링**: 과거 선택 패턴 분석
- **하이브리드 접근**: 두 방식의 가중 평균

### 2. 코스 편집 인터페이스

#### 2.1 핵심 기능
1. **드래그 앤 드롭**
   - 장소 순서 재배치
   - 터치 디바이스 지원
   - 실시간 경로 재계산

2. **장소 관리**
   - 장소 추가/제거
   - 대체 장소 제안
   - 시간 할당 조정

3. **실시간 검증**
   - 영업시간 확인
   - 이동 시간 계산
   - 예산 초과 경고

#### 2.2 UI/UX 설계
```typescript
// 코스 편집기 컴포넌트 구조
interface CourseEditorProps {
  course: GeneratedCourse;
  onSave: (editedCourse: Course) => void;
  suggestions: PlaceSuggestion[];
}

// 편집 가능한 장소 카드
interface EditablePlaceCard {
  place: Place;
  timeAllocation: number;
  onTimeChange: (minutes: number) => void;
  onRemove: () => void;
  onReorder: (newIndex: number) => void;
}
```

#### 2.3 편집 이력 관리
- 실행 취소/다시 실행 (Undo/Redo)
- 편집 전후 비교
- 자동 저장 (5초마다)

### 3. 고급 필터 시스템

#### 3.1 필터 카테고리

1. **예산 필터**
   - 슬라이더 UI
   - 장소별 예상 비용
   - 총 예산 실시간 계산

2. **접근성 옵션**
   - 휠체어 접근 가능
   - 엘리베이터 유무
   - 주차 시설
   - 대중교통 접근성

3. **날씨 연동**
   - 실시간 날씨 API
   - 실내/실외 장소 조정
   - 우천시 대안 제시

4. **그룹 설정**
   - 인원수 (2명, 4명, 단체)
   - 연령대 고려
   - 가족 친화적 옵션

#### 3.2 필터 UI 구현
```typescript
interface AdvancedFilters {
  budget: {
    min: number;
    max: number;
    includeTransport: boolean;
  };
  accessibility: {
    wheelchairAccess: boolean;
    parkingRequired: boolean;
    publicTransportOnly: boolean;
  };
  weather: {
    considerWeather: boolean;
    preferIndoor: boolean;
  };
  group: {
    size: number;
    hasChildren: boolean;
    hasSeniors: boolean;
  };
}
```

## 기술 구현 계획

### 1. 데이터베이스 스키마 확장

```sql
-- 사용자 선호도 테이블
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_preferences JSONB DEFAULT '{}',
  price_range_min INTEGER DEFAULT 0,
  price_range_max INTEGER DEFAULT 100000,
  preferred_themes TEXT[] DEFAULT '{}',
  accessibility_needs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 선호도 학습 이벤트
CREATE TABLE preference_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'like', 'dislike', 'visit', 'view', 'skip'
  target_type TEXT NOT NULL, -- 'place', 'course', 'category'
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코스 편집 이력
CREATE TABLE course_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_course JSONB NOT NULL,
  edited_course JSONB NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. API 엔드포인트 설계

```typescript
// 선호도 관련 API
POST   /api/preferences/learn       // 선호도 학습 이벤트 기록
GET    /api/preferences/profile     // 사용자 선호도 프로필 조회
PUT    /api/preferences/update      // 선호도 수동 업데이트

// 코스 편집 API
POST   /api/courses/:id/edit        // 코스 편집
GET    /api/courses/:id/history     // 편집 이력 조회
POST   /api/courses/:id/fork        // 코스 복제 후 편집

// 고급 필터 API
POST   /api/courses/generate-filtered  // 필터 적용 코스 생성
GET    /api/filters/options            // 사용 가능한 필터 옵션
```

### 3. 프론트엔드 컴포넌트 구조

```
app/components/
├── preferences/
│   ├── PreferenceCollector.tsx    # 초기 선호도 수집
│   ├── PreferenceProfile.tsx      # 선호도 프로필 표시
│   └── PreferenceLearning.tsx     # 암묵적 학습 로직
├── course-editor/
│   ├── CourseEditor.tsx           # 메인 편집기
│   ├── DraggablePlaceList.tsx    # 드래그 가능 장소 목록
│   ├── PlaceTimePicker.tsx       # 시간 할당 선택기
│   └── EditHistory.tsx           # 편집 이력 뷰어
└── filters/
    ├── AdvancedFilterPanel.tsx    # 필터 패널
    ├── BudgetSlider.tsx          # 예산 슬라이더
    ├── AccessibilityOptions.tsx  # 접근성 옵션
    └── WeatherFilter.tsx         # 날씨 필터
```

## 개발 일정 (5일)

### Day 1: 데이터베이스 및 백엔드 기초
- [x] 데이터베이스 스키마 생성
- [x] Supabase RLS 정책 설정
- [x] 기본 API 엔드포인트 구현
- [x] 타입 정의 및 생성

### Day 2: 선호도 학습 시스템
- [x] PreferenceCollector 컴포넌트
- [x] 학습 이벤트 추적 로직
- [x] 선호도 점수 계산 알고리즘
- [x] 프로필 표시 UI

### Day 3: 코스 편집기 핵심 기능
- [x] 드래그 앤 드롭 구현
- [x] 장소 추가/제거 기능
- [x] 시간 할당 조정 UI
- [x] 실시간 검증 로직

### Day 4: 고급 필터 시스템
- [ ] 필터 패널 UI
- [ ] 예산 계산 로직
- [ ] 접근성 필터링
- [ ] 날씨 API 통합

### Day 5: 통합 및 최적화
- [ ] 전체 기능 통합 테스트
- [ ] 성능 최적화
- [ ] 사용자 테스트
- [ ] 버그 수정 및 개선

## 성공 지표

### 정량적 지표
- 코스 편집 사용률 > 30%
- 필터 사용률 > 50%
- 평균 세션 시간 20% 증가
- 코스 완료율 15% 향상

### 정성적 지표
- 사용자 만족도 향상
- 개인화 체감도 증가
- 편집 기능 사용성
- 필터 정확도

## 위험 관리

### 기술적 위험
1. **드래그 앤 드롭 호환성**
   - 해결: 터치/마우스 모두 지원
   - 폴백: 버튼 기반 재정렬

2. **실시간 성능**
   - 해결: 디바운싱, 로컬 상태 관리
   - 캐싱 전략 적용

3. **날씨 API 제한**
   - 해결: 캐싱, 폴백 데이터
   - 무료 티어 내 사용

### UX 위험
1. **복잡도 증가**
   - 해결: 점진적 공개
   - 튜토리얼 제공

2. **선택 피로감**
   - 해결: 스마트 기본값
   - 간단/고급 모드 분리

## 다음 단계 예고

Phase 2.1 완료 후:
- Phase 2.2: 소셜 기능 (공유, 리뷰, 커뮤니티)
- Phase 2.3: 모바일 최적화 (PWA, 터치 최적화)

---

*문서 생성일: 2025-07-16*
*버전: 1.0*