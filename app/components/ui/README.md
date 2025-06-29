# 🎨 Course-More-Us UI 컴포넌트 라이브러리

모던하고 일관된 UI/UX를 제공하는 재사용 가능한 컴포넌트들입니다.

## 📋 개발 가이드라인

### 🎯 **필수 원칙**
1. **공통 컴포넌트 우선 사용**: 새로운 UI 요소 개발 전 기존 컴포넌트 먼저 확인
2. **디자인 시스템 준수**: 일관된 스타일링 규칙 적용
3. **타입 안전성**: TypeScript 인터페이스 적극 활용
4. **접근성 고려**: 키보드 탐색, 스크린 리더 지원

### 🎨 **통일된 디자인 시스템**

| 요소 | 스타일 | 설명 |
|------|--------|------|
| **Border Radius** | `rounded-xl` | 12px, 모든 컴포넌트 통일 |
| **Padding** | `px-4 py-3` | 내부 여백 표준 |
| **Transition** | `transition-all duration-200` | 부드러운 애니메이션 |
| **Focus Ring** | `focus:ring-2` | 포커스 상태 강조 |
| **Shadow** | `shadow-sm` / `shadow-2xl` | 기본/드롭다운 그림자 |
| **Hover** | `hover:shadow-md` | 호버 시 그림자 증가 |

### ✅ **개발 체크리스트**

#### 새로운 기능 개발 시:
- [ ] 드롭다운/선택 UI → `Dropdown` 컴포넌트 사용
- [ ] 버튼 → `Button` 컴포넌트 사용
- [ ] 입력 필드 → `Input`, `Textarea` 컴포넌트 사용
- [ ] 날짜 선택 → `Calendar` 컴포넌트 사용
- [ ] 모달/팝업 → `Modal` 컴포넌트 사용
- [ ] 폼 레이아웃 → `FormField` 컴포넌트 사용
- [ ] 에러 표시 → `ErrorMessage` 컴포넌트 사용

#### 스타일링 시:
- [ ] 디자인 시스템 규칙 준수
- [ ] 기존 variant 활용 (primary, secondary, outline 등)
- [ ] 반응형 고려 (모바일 우선)

---

## 📦 컴포넌트 가이드

### 🔘 Button

기본 버튼 컴포넌트로 다양한 변형을 지원합니다.

```tsx
import { Button } from '~/components/ui';

// 기본 사용법
<Button>클릭하세요</Button>

// 변형별 사용
<Button variant="primary">주 버튼</Button>
<Button variant="secondary">보조 버튼</Button>
<Button variant="outline">외곽선 버튼</Button>
<Button variant="ghost">투명 버튼</Button>

// 크기별 사용
<Button size="sm">작은 버튼</Button>
<Button size="md">중간 버튼</Button>
<Button size="lg">큰 버튼</Button>

// 상태별 사용
<Button disabled>비활성화</Button>
<Button loading>로딩 중...</Button>
```

### 📝 Input & Textarea

입력 필드 컴포넌트들입니다.

```tsx
import { Input, Textarea } from '~/components/ui';

// 기본 입력 필드
<Input
  label="이름"
  name="name"
  placeholder="이름을 입력하세요"
  required
/>

// 에러 상태
<Input
  label="이메일"
  name="email"
  type="email"
  error="올바른 이메일을 입력하세요"
/>

// 도움말 포함
<Input
  label="비밀번호"
  type="password"
  helperText="8자 이상 입력하세요"
/>

// 텍스트 영역
<Textarea
  label="설명"
  name="description"
  rows={4}
  placeholder="상세 설명을 입력하세요"
/>
```

### 🗓️ Calendar

날짜 선택 컴포넌트입니다.

```tsx
import { Calendar } from '~/components/ui';

<Calendar
  name="visitDate"
  label="방문 날짜"
  required
  helperText="방문 예정일을 선택하세요"
  minDate={new Date()}
/>
```

### 🪟 Modal

모달 다이얼로그 컴포넌트입니다.

```tsx
import { Modal } from '~/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="확인"
  maxWidth="md"
>
  <p>정말로 삭제하시겠습니까?</p>
  <div className="flex justify-end space-x-2 mt-4">
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      취소
    </Button>
    <Button variant="primary" onClick={handleDelete}>
      삭제
    </Button>
  </div>
</Modal>
```

### 📋 FormField

폼 레이아웃을 위한 래퍼 컴포넌트입니다.

```tsx
import { FormField } from '~/components/ui';

<FormField
  label="카테고리"
  required
  error={errors.category}
  helperText="장소의 카테고리를 선택하세요"
>
  <CustomSelectComponent />
</FormField>
```

### ⚠️ ErrorMessage

에러 메시지 표시 컴포넌트입니다.

```tsx
import { ErrorMessage } from '~/components/ui';

<ErrorMessage 
  message="서버 오류가 발생했습니다" 
  variant="error" 
/>
<ErrorMessage 
  message="성공적으로 저장되었습니다" 
  variant="success" 
/>
```

### 🔽 Dropdown

### 기본 사용법

```tsx
import { Dropdown, type DropdownOption } from '~/components/ui';

const options: DropdownOption[] = [
  { value: '1', label: '카페', icon: '☕', description: '감성적인 카페' },
  { value: '2', label: '음식점', icon: '🍽️', description: '맛있는 레스토랑' },
  { value: '3', label: '문화시설', icon: '🎨', description: '전시회, 공연장' },
];

function MyComponent() {
  const [selectedValue, setSelectedValue] = useState(null);

  return (
    <Dropdown
      options={options}
      selectedValue={selectedValue}
      onSelect={setSelectedValue}
      label="카테고리"
      placeholder="카테고리를 선택하세요"
      required
      searchable
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `DropdownOption[]` | required | 드롭다운 옵션 배열 |
| `selectedValue` | `string \| number \| null` | - | 현재 선택된 값 |
| `onSelect` | `(value: string \| number \| null) => void` | required | 값 선택 시 콜백 |
| `placeholder` | `string` | "선택하세요" | 플레이스홀더 텍스트 |
| `label` | `string` | - | 라벨 텍스트 |
| `required` | `boolean` | false | 필수 입력 여부 |
| `error` | `string` | - | 에러 메시지 |
| `helperText` | `string` | - | 도움말 텍스트 |
| `searchable` | `boolean` | false | 검색 기능 활성화 |
| `allowClear` | `boolean` | false | 전체 선택 옵션 표시 |
| `clearLabel` | `string` | "전체" | 전체 선택 옵션 라벨 |
| `variant` | `'default' \| 'purple' \| 'blue'` | "default" | 디자인 변형 |
| `loading` | `boolean` | false | 로딩 상태 |
| `disabled` | `boolean` | false | 비활성화 상태 |

### DropdownOption 인터페이스

```tsx
interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;           // 아이콘 (이모지 또는 텍스트)
  description?: string;    // 설명 텍스트
  disabled?: boolean;      // 비활성화 여부
}
```

### 변형 (Variants)

#### Default
- 일반적인 흰색 배경의 드롭다운
- 파란색 포커스 링

#### Purple
- 반투명 배경 (메인 페이지용)
- 보라색 포커스 링
- 흰색 텍스트

#### Blue
- 파란색 테마의 드롭다운

### 사용 사례

#### 1. 기본 카테고리 선택
```tsx
<Dropdown
  options={categoryOptions}
  selectedValue={categoryId}
  onSelect={setCategoryId}
  label="카테고리"
  required
/>
```

#### 2. 검색 가능한 지역 선택
```tsx
<Dropdown
  options={regionOptions}
  selectedValue={regionId}
  onSelect={setRegionId}
  label="지역"
  searchable
  allowClear
  clearLabel="전체 지역"
/>
```

#### 3. 폼과 함께 사용
```tsx
<form>
  <Dropdown
    options={options}
    selectedValue={value}
    onSelect={setValue}
    label="선택 항목"
    error={errors.field}
    helperText="도움말 텍스트"
  />
  
  {/* Hidden input for form submission */}
  <input type="hidden" name="field" value={value || ''} />
</form>
```

## 🎨 Select (업데이트됨)

기존 HTML select 기반 컴포넌트도 모던한 디자인으로 업데이트되었습니다.

- 더 둥근 모서리 (rounded-xl)
- 그림자 효과
- 부드러운 애니메이션
- 향상된 호버 상태

## 🌟 디자인 일관성

모든 드롭다운 컴포넌트는 다음과 같은 일관된 디자인을 따릅니다:

- **Border Radius**: `rounded-xl` (12px)
- **Padding**: `px-4 py-3`
- **Transition**: `transition-all duration-200`
- **Focus Ring**: `focus:ring-2`
- **Shadow**: `shadow-sm` (기본), `shadow-2xl` (드롭다운)

---

## 🔧 개발자 가이드

### 📝 Form 연동 패턴

#### Controlled Components
```tsx
// 상태 관리
const [selectedValue, setSelectedValue] = useState(null);

// UI 렌더링
<Dropdown
  options={options}
  selectedValue={selectedValue}
  onSelect={setSelectedValue}
/>

// Form 전송용 hidden input
<input type="hidden" name="fieldName" value={selectedValue || ''} />
```

#### Form Data 처리
```tsx
// Remix Action에서 데이터 처리
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const categoryId = formData.get('category_id') as string;
  
  // 데이터 처리 로직...
}
```

### 🎨 스타일링 베스트 프랙티스

#### 컴포넌트 확장
```tsx
// 기본 컴포넌트를 베이스로 커스텀 스타일 추가
<Button 
  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
>
  그라데이션 버튼
</Button>

// Variant 활용
<Dropdown variant="purple" /> // 메인 페이지용
<Dropdown variant="blue" />   // 관리자 페이지용
<Dropdown variant="default" /> // 일반 폼용
```

#### 반응형 디자인
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input label="이름" />
  <Dropdown label="카테고리" options={categories} />
</div>
```

### 🔄 재사용 패턴

#### 옵션 변환 헬퍼
```tsx
// 서버 데이터를 Dropdown 옵션으로 변환
const categoryOptions: DropdownOption[] = categories.map(category => ({
  value: String(category.id),
  label: category.name,
  icon: category.icon || '',
  description: category.description || undefined
}));
```

#### 공통 폼 레이아웃
```tsx
function StandardForm({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      {children}
    </div>
  );
}
```

### ⚡ 성능 최적화

#### 메모화 활용
```tsx
const categoryOptions = useMemo(() => 
  categories.map(cat => ({
    value: String(cat.id),
    label: cat.name,
    icon: cat.icon
  })), 
  [categories]
);
```

#### 지연 로딩
```tsx
// 필요한 시점에만 데이터 로드
const [isOpen, setIsOpen] = useState(false);

useEffect(() => {
  if (isOpen && !data) {
    fetchData();
  }
}, [isOpen]);
```

### 🧪 테스팅 가이드

#### 컴포넌트 테스트
```tsx
// 기본 렌더링 테스트
test('renders dropdown with options', () => {
  render(
    <Dropdown
      options={mockOptions}
      selectedValue={null}
      onSelect={jest.fn()}
    />
  );
  expect(screen.getByText('선택하세요')).toBeInTheDocument();
});
```

### 🌍 접근성 준수

#### 키보드 탐색
- `Tab`: 포커스 이동
- `Enter/Space`: 드롭다운 열기
- `Arrow Keys`: 옵션 탐색
- `Esc`: 드롭다운 닫기

#### 스크린 리더 지원
```tsx
<Dropdown
  options={options}
  aria-label="카테고리 선택"
  aria-describedby="category-help"
/>
<div id="category-help">장소의 카테고리를 선택하세요</div>
```

---

## 🚀 마이그레이션 가이드

### 기존 HTML 요소를 UI 컴포넌트로 교체

#### HTML select → Dropdown
```tsx
// Before ❌
<select name="category" className="...">
  <option value="">선택하세요</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
  ))}
</select>

// After ✅
<Dropdown
  options={categoryOptions}
  selectedValue={selectedCategory}
  onSelect={setSelectedCategory}
  placeholder="카테고리를 선택하세요"
/>
<input type="hidden" name="category" value={selectedCategory || ''} />
```

#### HTML button → Button
```tsx
// Before ❌
<button className="px-4 py-2 bg-blue-500 text-white rounded...">
  저장
</button>

// After ✅
<Button variant="primary">저장</Button>
```

### 일관성 체크리스트

새로운 UI 요소 추가 시 확인사항:
- [ ] 기존 컴포넌트로 구현 가능한가?
- [ ] 디자인 시스템 규칙을 준수하는가?
- [ ] TypeScript 타입이 정의되어 있는가?
- [ ] 접근성 요구사항을 만족하는가?
- [ ] 반응형 디자인이 적용되어 있는가?

---

## 📚 참고 자료

- **컴포넌트 위치**: `app/components/ui/`
- **타입 정의**: `app/components/ui/index.ts`
- **사용 예시**: `app/routes/` 내 각 페이지 참조
- **디자인 토큰**: Tailwind CSS 설정 파일

---

## 🔥 Quick Reference

### 빠른 시작
```tsx
// 1. 컴포넌트 import
import { Button, Input, Dropdown, type DropdownOption } from '~/components/ui';

// 2. 기본 폼 구성
function MyForm() {
  const [category, setCategory] = useState(null);
  
  return (
    <form className="space-y-6">
      <Input label="제목" name="title" required />
      <Dropdown 
        options={categoryOptions} 
        selectedValue={category}
        onSelect={setCategory}
        label="카테고리"
        searchable
      />
      <Button type="submit" variant="primary">저장</Button>
    </form>
  );
}
```

### 자주 사용하는 패턴
| 용도 | 컴포넌트 | 주요 Props |
|------|----------|-----------|
| **선택 UI** | `Dropdown` | `options`, `searchable`, `variant` |
| **텍스트 입력** | `Input` | `label`, `required`, `error` |
| **긴 텍스트** | `Textarea` | `rows`, `resize` |
| **날짜 선택** | `Calendar` | `minDate`, `name` |
| **액션 버튼** | `Button` | `variant`, `size`, `disabled` |
| **팝업** | `Modal` | `isOpen`, `onClose`, `title` |

### 꼭 기억할 것 ✨
1. **Dropdown 우선 사용**: select 태그 대신 Dropdown 컴포넌트
2. **hidden input 패턴**: 폼 전송 시 controlled component와 함께 사용
3. **variant 활용**: 페이지별 테마에 맞는 변형 선택
4. **TypeScript 타입**: `DropdownOption` 등 기존 타입 적극 활용
5. **디자인 시스템**: `rounded-xl`, `px-4 py-3`, `transition-all` 통일

---

> 💡 **Tip**: 새로운 UI 요소가 필요하면 이 문서를 먼저 확인하고, 없는 경우에만 새로 만들어주세요! 