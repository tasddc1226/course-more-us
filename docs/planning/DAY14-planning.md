# DAY14 개발 계획 - 안정화 & 완성도 향상

## 개요
DAY13에서 사용자 선호도 학습 시스템, 코스 편집 인터페이스, 고급 필터 시스템이 95% 완성되었습니다. DAY14는 시스템 안정화와 완성도 향상에 집중하여 프로덕션 준비를 완료합니다.

## 현재 상태 분석

### ✅ 완료된 주요 기능 (95%)
- **사용자 선호도 학습 시스템**: 완전 구현
  - 데이터베이스: user_preferences, preference_learning_events 테이블
  - API: /api/preferences/* 엔드포인트
  - 컴포넌트: PreferenceCollector, PreferenceProfile, PreferenceLearning
  - 7가지 이벤트 타입 추적 (like/dislike/visit/view/skip/save/share)

- **코스 편집 인터페이스**: 90% 완성
  - 드래그 앤 드롭: react-beautiful-dnd 기반 완전 구현
  - 장소 관리: 추가/제거/순서변경 모든 기능
  - 실시간 상태 관리: CourseEditor, DraggablePlaceList
  - 편집 이력: course_edit_history 테이블 및 API

- **고급 필터 시스템**: 95% 완성
  - 예산 필터: BudgetSlider - 실시간 비용 계산
  - 접근성 옵션: AccessibilityOptions
  - 그룹 설정: 인원수, 어린이/노인 고려
  - API: /api/courses/generate-filtered, /api/filters/options

### ⚠️ 해결 필요한 이슈들

#### 1. 긴급 수정 필요 (25개 TypeScript 에러)
데이터베이스 동기화 후 타입 불일치로 인한 빌드 실패:
- **course_edit_history 테이블 타입 누락**: 새로 생성된 테이블이 타입에 반영되지 않음
- **RecommendedPlace 인터페이스 불일치**: address, accessibility_features 필드 누락
- **Supabase 클라이언트 타입 문제**: admin.server.ts에서 supabase 프로퍼티 접근 오류
- **Json 타입 변환 이슈**: course_data JSONB 필드와 DateCourse 타입 간 변환 문제

#### 2. 누락된 UI 컴포넌트 (10%)
DAY13 계획에서 예정되었으나 구현되지 않은 컴포넌트들:
- **EditHistory.tsx**: 코스 편집 이력 뷰어 (API는 구현됨)
- **PlaceTimePicker.tsx**: 개별 시간 할당 선택기
- **WeatherFilter.tsx**: 실시간 날씨 필터 (계획에 있었으나 미구현)

#### 3. 사용성 개선 필요 영역
- 실행 취소/다시 실행 기능
- 자동 저장 메커니즘
- 에러 상태 처리 개선
- 로딩 상태 UX 향상

## DAY14 목표

### 🎯 주요 목표
1. **시스템 안정화**: 모든 TypeScript 에러 해결 및 빌드 정상화
2. **기능 완성도 향상**: 누락된 컴포넌트 구현으로 100% 완성
3. **사용자 경험 개선**: 에러 처리, 로딩 상태, 자동 저장 등
4. **프로덕션 준비**: 통합 테스트 및 성능 최적화

### 📊 성공 지표
- TypeScript 컴파일 에러: 25개 → 0개
- 컴포넌트 완성도: 90% → 100%
- 기능 통합 테스트: 0% → 90%
- 사용자 경험 점수: 개선 측정

## 상세 작업 계획

### Phase 1: 긴급 안정화 (당일 완료)

#### 1.1 TypeScript 에러 수정 (1-2시간)
**우선순위 1**: 빌드 실패 해결

```typescript
// 수정 필요한 주요 파일들
- app/types/database.types.ts: course_edit_history 타입 추가
- app/lib/recommendation/types.ts: RecommendedPlace 인터페이스 업데이트
- app/lib/admin.server.ts: Supabase 클라이언트 타입 수정
- app/lib/course-editor.server.ts: Json ↔ DateCourse 변환 로직 수정
```

**세부 작업**:
- [ ] course_edit_history 테이블 타입이 database.types.ts에 누락 → 타입 재생성
- [ ] RecommendedPlace에 address, accessibility_features 필드 추가
- [ ] admin.server.ts에서 supabase 클라이언트 접근 방식 수정
- [ ] course-editor.server.ts에서 Json 타입 안전 변환 로직 구현

#### 1.2 컴파일 및 린트 검증
- [ ] `npm run typecheck` 통과 확인
- [ ] `npm run lint` 통과 확인
- [ ] `npm run build` 성공 확인

### Phase 2: 컴포넌트 완성 (1일)

#### 2.1 EditHistory.tsx 구현
코스 편집 이력을 시각적으로 표시하는 컴포넌트:

```typescript
interface EditHistoryProps {
  courseId: string;
  onRestore?: (courseData: DateCourse) => void;
}

// 기능 요구사항
- 편집 이력 타임라인 표시
- 원본/편집본 diff 뷰어
- 특정 버전으로 복원 기능
- 변경사항 하이라이트
```

#### 2.2 PlaceTimePicker.tsx 구현
개별 장소의 체류 시간을 설정하는 컴포넌트:

```typescript
interface PlaceTimePickerProps {
  place: RecommendedPlace;
  initialDuration: number;
  onDurationChange: (duration: number) => void;
  minDuration?: number;
  maxDuration?: number;
}

// 기능 요구사항
- 슬라이더 + 직접 입력 UI
- 추천 시간대 표시 (장소 유형별)
- 실시간 총 시간 계산
- 시간 검증 로직
```

#### 2.3 WeatherFilter.tsx 구현
날씨 기반 필터링 컴포넌트:

```typescript
interface WeatherFilterProps {
  selectedDate: string;
  regionId: number;
  onWeatherPreferenceChange: (preference: WeatherPreference) => void;
}

// 기능 요구사항
- 실시간 날씨 API 연동
- 실내/실외 선호도 설정
- 날씨 기반 장소 추천 조정
- 우천시 대안 제시
```

### Phase 3: 사용성 개선 (1-2일)

#### 3.1 실행 취소/다시 실행 시스템
```typescript
// 구현 대상
- app/hooks/useUndoRedo.ts: 상태 관리 훅
- app/components/course-editor/UndoRedoControls.tsx: UI 컴포넌트
- 최대 10단계 되돌리기 지원
- 키보드 단축키 (Ctrl+Z, Ctrl+Y) 지원
```

#### 3.2 자동 저장 시스템
```typescript
// 구현 대상
- app/hooks/useAutoSave.ts: 자동 저장 훅
- 5초 간격 자동 저장
- 변경사항 감지 로직
- 저장 상태 표시 UI
- 오프라인 지원 (로컬 스토리지)
```

#### 3.3 에러 처리 개선
```typescript
// 구현 대상
- app/components/common/ErrorBoundary.tsx
- app/components/common/LoadingSpinner.tsx
- 네트워크 에러 처리
- 타임아웃 처리
- 사용자 친화적 에러 메시지
```

### Phase 4: 통합 테스트 & 최적화 (1일)

#### 4.1 기능 통합 테스트
- [ ] 선호도 학습 → 추천 시스템 연동 테스트
- [ ] 코스 편집 → 필터 시스템 통합 테스트  
- [ ] 드래그 앤 드롭 성능 테스트
- [ ] 실시간 상태 동기화 테스트
- [ ] 크로스 브라우저 호환성 테스트

#### 4.2 성능 최적화
- [ ] 컴포넌트 메모이제이션 최적화
- [ ] 번들 크기 분석 및 최적화
- [ ] 이미지 레이지 로딩 구현
- [ ] API 호출 디바운싱 개선

#### 4.3 사용자 시나리오 테스트
```
시나리오 1: 새 사용자 코스 생성
1. 선호도 수집 → 2. 필터 설정 → 3. 코스 생성 → 4. 편집 → 5. 저장

시나리오 2: 기존 코스 편집
1. 코스 로드 → 2. 장소 추가/제거 → 3. 순서 변경 → 4. 시간 조정 → 5. 저장

시나리오 3: 고급 필터 사용  
1. 예산 설정 → 2. 접근성 옵션 → 3. 날씨 고려 → 4. 결과 확인
```

## 기술적 구현 세부사항

### 1. TypeScript 에러 수정 방법

#### 1.1 course_edit_history 타입 누락 수정
```bash
# 원격에서 타입 재생성
supabase gen types typescript --linked > app/types/database.types.ts
```

#### 1.2 RecommendedPlace 인터페이스 업데이트
```typescript
// app/lib/recommendation/types.ts
export interface RecommendedPlace {
  // 기존 필드들...
  address: string;                    // 추가 필요
  accessibility_features?: string[];  // 추가 필요
}
```

#### 1.3 Json 타입 안전 변환
```typescript
// app/lib/course-editor.server.ts
function safeJsonToCourse(json: Json): DateCourse | null {
  try {
    if (typeof json === 'object' && json !== null) {
      return json as DateCourse;
    }
    return null;
  } catch {
    return null;
  }
}
```

### 2. 컴포넌트 아키텍처

#### 2.1 EditHistory 컴포넌트 구조
```typescript
app/components/course-editor/
├── EditHistory.tsx           # 메인 컴포넌트
├── HistoryTimeline.tsx      # 타임라인 UI
├── HistoryDiffViewer.tsx    # 변경사항 비교
└── HistoryRestoreButton.tsx # 복원 버튼
```

#### 2.2 상태 관리 전략
```typescript
// React Query 활용한 서버 상태 관리
const { data: editHistory } = useQuery({
  queryKey: ['courseEditHistory', courseId],
  queryFn: () => getCourseEditHistory(courseId),
  refetchInterval: 30000, // 30초마다 갱신
});
```

### 3. 성능 최적화 전략

#### 3.1 컴포넌트 최적화
```typescript
// React.memo를 활용한 리렌더링 최적화
const OptimizedPlaceCard = memo(PlaceCard, (prev, next) => {
  return prev.place.id === next.place.id && 
         prev.isSelected === next.isSelected;
});
```

#### 3.2 상태 업데이트 최적화
```typescript
// useCallback을 활용한 핸들러 최적화
const handlePlaceReorder = useCallback((newPlaces: CoursePlaceInfo[]) => {
  setEditedCourse(prev => ({
    ...prev,
    places: newPlaces
  }));
}, []);
```

## 위험 관리 및 대응책

### 기술적 위험
1. **TypeScript 에러 복잡성**
   - 위험: 타입 에러가 서로 연결되어 수정이 복잡할 수 있음
   - 대응: 단계적 수정, 각 파일별 개별 테스트

2. **성능 저하**  
   - 위험: 드래그 앤 드롭과 실시간 업데이트로 인한 성능 이슈
   - 대응: 디바운싱, 메모이제이션, 가상화 검토

3. **브라우저 호환성**
   - 위험: 드래그 앤 드롭이 모든 브라우저에서 동작하지 않을 수 있음
   - 대응: Fallback UI 제공, 터치 디바이스 지원

### 일정 위험
1. **복잡한 버그 발견**
   - 위험: 통합 테스트에서 예상치 못한 버그 발견
   - 대응: 단계별 테스트, 롤백 계획 준비

2. **외부 API 의존성**
   - 위험: 날씨 API 제한이나 장애
   - 대응: 캐싱 전략, Fallback 데이터

## 품질 보증

### 테스트 전략
1. **유닛 테스트**: 핵심 비즈니스 로직
2. **통합 테스트**: 컴포넌트 간 상호작용
3. **E2E 테스트**: 주요 사용자 시나리오
4. **성능 테스트**: 렌더링 성능, 메모리 사용량

### 코드 품질
1. **TypeScript 엄격 모드**: 모든 에러 해결
2. **ESLint 규칙**: 코드 일관성 유지
3. **Prettier 포맷팅**: 자동 코드 정리
4. **코드 리뷰**: 주요 변경사항 검토

## 다음 단계 (DAY15+)

### Option A: Phase 2.2 - 소셜 기능 (추천)
**예상 소요**: 5-7일
- 코스 공유 시스템
- 사용자 리뷰 및 사진 기능
- 커뮤니티 기능
- 소셜 로그인 확대

### Option B: 성능 최적화 & PWA
**예상 소요**: 3-4일
- 캐싱 전략 고도화
- 번들 최적화 및 코드 스플리팅
- PWA 구현 (오프라인 지원)
- 모바일 UX 개선

### Option C: 고급 AI 기능
**예상 소요**: 4-5일
- 실시간 트렌드 분석
- 개인화 알고리즘 고도화
- 스마트 추천 엔진
- 예측 분석 및 인사이트

## 성과 측정

### 기술적 지표
- TypeScript 컴파일 에러: 0개
- 테스트 커버리지: 80% 이상
- 번들 크기: 현재 대비 10% 감소
- 페이지 로드 시간: 3초 이내

### 사용자 경험 지표  
- 코스 편집 완료율: 85% 이상
- 에러 발생률: 1% 미만
- 사용자 만족도: 4.5/5.0 이상
- 기능 사용률: 편집 30%, 필터 50%

---

*문서 생성일: 2025-07-27*  
*DAY14 시작: Phase 2.1 안정화 및 완성도 향상*