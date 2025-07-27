# DAY15 개발 계획 - UI 컴포넌트 완성 & 고급 기능 구현

## 개요
DAY13-14에서 핵심 시스템 구축과 안정화가 완료되었습니다. DAY15는 누락된 UI 컴포넌트 완성과 사용자 경험을 향상시키는 고급 기능에 집중합니다.

## 현재 상태 (DAY14 완료 기준)

### ✅ DAY13-14 완료 사항
- **핵심 시스템**: 사용자 선호도 학습, 코스 편집, 고급 필터 (95% 완성)
- **안정화**: TypeScript 에러 해결, 코드 최적화, 데이터베이스 동기화
- **품질 개선**: Debug 코드 정리, import 최적화, 성능 향상

### 🔴 남은 주요 작업
- **누락된 UI 컴포넌트**: EditHistory, PlaceTimePicker, WeatherFilter
- **고급 기능**: 실행취소/다시실행, 자동저장
- **테스트 및 최적화**: 통합 테스트, 성능 모니터링

## DAY15 목표

### 1. 누락된 UI 컴포넌트 완성 (우선순위 1)

#### EditHistory 컴포넌트
```typescript
// 위치: app/components/course-editor/EditHistory.tsx
interface EditHistoryProps {
  courseId: string;
  userId: string;
  onHistorySelect: (historyItem: CourseEditHistory) => void;
}
```
**기능**:
- 코스 편집 이력 조회 및 표시
- 타임라인 형태의 변경 이력 UI
- 특정 시점으로 되돌리기 기능
- 변경 내용 diff 표시

#### PlaceTimePicker 컴포넌트
```typescript
// 위치: app/components/common/PlaceTimePicker.tsx
interface PlaceTimePickerProps {
  timeSlots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  minDuration?: number;
  maxDuration?: number;
}
```
**기능**:
- 장소별 방문 시간 설정
- 시간대별 추천 표시
- 소요 시간 계산 및 조정
- 다음 장소와의 이동 시간 고려

#### WeatherFilter 컴포넌트
```typescript
// 위치: app/components/filters/WeatherFilter.tsx
interface WeatherFilterProps {
  currentWeather?: WeatherInfo;
  onWeatherPreferenceChange: (preference: WeatherPreference) => void;
  showForecast?: boolean;
}
```
**기능**:
- 현재 날씨 정보 표시
- 실내/실외 장소 선호도 설정
- 날씨 기반 자동 필터링
- 일기예보 연동 옵션

### 2. 고급 기능 구현 (우선순위 2)

#### 실행취소/다시실행 시스템
**구현 위치**: 
- `app/hooks/useUndoRedo.ts`
- `app/components/course-editor/UndoRedoControls.tsx`

**기능**:
- 코스 편집 액션 스택 관리
- Ctrl+Z / Ctrl+Y 키보드 단축키
- 최대 20개 액션 히스토리 유지
- 시각적 되돌리기/앞으로가기 버튼

#### 자동저장 시스템
**구현 위치**:
- `app/hooks/useAutoSave.ts`
- `app/lib/course-autosave.server.ts`

**기능**:
- 3초 debounce 자동저장
- 네트워크 상태 확인 및 재시도
- 충돌 감지 및 해결
- 저장 상태 UI 표시

### 3. 사용자 경험 개선 (우선순위 3)

#### 향상된 드래그 앤 드롭
- 드래그 중 미리보기 강화
- 드롭 존 시각적 피드백 개선
- 터치 디바이스 성능 최적화

#### 스마트 장소 추천
- 편집 중 실시간 대안 장소 제안
- 시간대 및 예산 기반 추천
- 사용자 선호도 반영 우선순위

## 구현 계획

### Phase 1: 기본 UI 컴포넌트 (4-6시간)
1. **EditHistory 컴포넌트**
   - 기본 UI 구조 및 데이터 연동
   - 이력 목록 표시 및 선택 기능
   - 변경 내용 diff 표시

2. **PlaceTimePicker 컴포넌트**
   - 시간 선택 UI (시간/분 선택기)
   - 소요 시간 계산 로직
   - 다른 컴포넌트와의 연동

3. **WeatherFilter 컴포넌트**
   - 기본 날씨 정보 표시
   - 실내/실외 선호도 토글
   - 필터 시스템과 연동

### Phase 2: 고급 기능 구현 (6-8시간)
1. **실행취소/다시실행**
   - 액션 스택 관리 훅 구현
   - 키보드 단축키 지원
   - UI 컨트롤 추가

2. **자동저장**
   - 자동저장 훅 구현
   - 서버 API 연동
   - 에러 처리 및 재시도

### Phase 3: 통합 및 최적화 (2-4시간)
1. **컴포넌트 통합 테스트**
2. **성능 최적화 및 버그 수정**
3. **사용자 시나리오 테스트**

## 기술적 고려사항

### 1. course_edit_history 테이블 활성화
현재 임시 비활성화된 course_edit_history 관련 함수들을 활성화:
```typescript
// app/lib/course-editor.server.ts
// TODO 주석 제거 및 함수 활성화 필요
```

### 2. 날씨 API 통합
WeatherFilter를 위한 날씨 API 연동:
```typescript
// 고려 옵션:
// - OpenWeatherMap API (무료 tier)
// - 기상청 API (한국 전용)
// - 클라이언트 측 위치 기반 자동 감지
```

### 3. 성능 최적화
- React.memo를 활용한 컴포넌트 최적화
- useMemo/useCallback을 통한 불필요한 리렌더링 방지
- 대용량 데이터 처리를 위한 가상화 고려

## 성공 기준

### 기능적 요구사항
- [ ] EditHistory: 코스 편집 이력 완전한 조회 및 복원
- [ ] PlaceTimePicker: 직관적인 시간 설정 및 계산
- [ ] WeatherFilter: 날씨 기반 실용적인 필터링
- [ ] 실행취소/다시실행: 안정적인 20단계 히스토리 관리
- [ ] 자동저장: 3초 debounce 및 에러 복구

### 비기능적 요구사항
- [ ] 모든 컴포넌트 TypeScript 완전 호환
- [ ] 모바일 디바이스 반응형 지원
- [ ] 접근성 (WCAG 2.1 AA) 준수
- [ ] 로딩 시간 3초 이내 유지

## 위험 요소 및 대응

### 높은 위험
- **날씨 API 비용/제한**: 대안 API 준비, 캐싱 전략
- **자동저장 충돌**: 충돌 감지 및 해결 로직 필수

### 중간 위험  
- **성능 이슈**: 점진적 최적화, 프로파일링 도구 활용
- **모바일 호환성**: 실기기 테스트 및 폴백 UI

## 다음 단계 (DAY16 준비)

DAY15 완료 후 DAY16에서는:
- **통합 테스트**: E2E 테스트 및 사용자 시나리오 검증
- **성능 최적화**: 번들 크기 최적화, 로딩 성능 개선
- **프로덕션 배포 준비**: 환경 설정, 모니터링 구성

---

*계획 수립일: 2025-07-27*  
*목표 완료일: 2025-07-28*  
*예상 소요 시간: 12-18시간*