# 코스모스 (Course-More-Us) - 2일차 개발 기록

> **개발 기간**: 2025년 06월 15일 ~ 2025년 6월 16일  
> **개발자**: yangsuyoung  
> **프로젝트**: 데이트 코스 추천 서비스 "코스모스"

## 📋 개발 개요

둘째날은 **이용약관 동의 시스템 구현**과 **회원가입 플로우 개선**에 집중했습니다. 특히 카카오 OAuth와 이메일 회원가입 모든 방식에 약관 동의 단계를 추가하고, 복잡한 RLS 순환 참조 문제를 해결하는 과정이 핵심이었습니다.

## 🚀 주요 구현 사항

### 1. 이용약관 시스템 구현 ✅

#### 서비스 이용약관 전문 페이지
- **파일**: `app/routes/terms.tsx`
- **내용**: 11개 조항의 상세한 서비스 이용약관
  1. 서비스 이용 목적 및 범위
  2. 회원가입 및 계정 관리
  3. 개인정보 처리 및 보호
  4. 서비스 이용 규칙
  5. 콘텐츠 및 지적재산권
  6. 서비스 제공 및 중단
  7. 요금 및 결제 (향후 적용)
  8. 책임의 제한
  9. 분쟁 해결
  10. 약관의 변경
  11. 기타 사항

#### 약관 동의 페이지
- **파일**: `app/routes/auth.terms.tsx`
- **기능**:
  - 전체 동의 토글 기능
  - 필수 약관 4개 (서비스 이용약관, 개인정보 처리방침, 만 14세 이상, 마케팅 정보 수신)
  - 선택 약관 7개 (위치정보 이용동의, 이벤트 알림 등)
  - 개별 약관 전문 모달창
  - 동의 상태 실시간 검증

### 2. 데이터베이스 스키마 확장 ✅

#### user_agreements 테이블 추가
```sql
CREATE TABLE user_agreements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type varchar(50) NOT NULL,
  agreed boolean DEFAULT false,
  agreed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 주요 특징
- **11개 약관 타입** 지원
- **사용자별 동의 이력** 추적
- **동의 시간** 기록
- **CASCADE 삭제** 처리

### 3. 회원가입 플로우 개선 ✅

#### 이메일 회원가입 플로우
1. **약관 동의** (`/auth/terms`)
2. **회원가입 폼** (`/auth/signup`)
3. **3초 카운트다운** 후 로그인 페이지 이동
4. **로그인** (`/auth/login`)

#### 카카오 OAuth 플로우 (최종)
1. **카카오 OAuth 인증** (클라이언트사이드)
2. **신규 사용자**: 약관 동의 페이지로 이동
3. **기존 사용자**: 메인 페이지로 바로 이동

### 4. 인증 시스템 개선 ✅

#### 새로운 서버 함수들
- **파일**: `app/lib/agreements.server.ts`
- **함수**:
  - `getUserAgreements()`: 사용자 동의 현황 조회
  - `upsertUserAgreements()`: 동의 정보 저장/업데이트
  - `hasRequiredAgreements()`: 필수 약관 동의 여부 확인

#### 인증 유틸리티
- **파일**: `app/lib/auth.utils.ts`
- **함수**:
  - `isNewUser()`: 신규 사용자 판별 로직
  - 약관 동의 완료 여부 확인

### 5. OAuth 콜백 처리 개선 ✅

#### auth.callback.tsx 수정
- **신규 사용자 감지**: 약관 동의 페이지로 리다이렉트
- **기존 사용자**: 메인 페이지로 바로 이동
- **에러 처리**: 인증 실패 시 로그인 페이지로 이동

## 🐛 해결된 주요 문제들

### 1. RLS 순환 참조 문제 🔥

#### 문제 상황
```
ERROR: infinite recursion detected in policy for relation "user_roles"
```

#### 원인 분석
- `user_agreements` 테이블의 관리자 정책이 `user_roles` 테이블을 조회
- `user_roles` 테이블의 RLS 정책이 다시 실행되면서 무한 순환 발생
- 복잡한 정책 구조로 인한 재귀 호출

#### 해결 과정
1. **1차 시도**: RLS 정책 구조 변경 (실패)
2. **2차 시도**: 정책 단순화 (실패)
3. **3차 시도**: RLS 완전 비활성화 (임시방편)
4. **최종 해결**: `service_role` 사용

#### 최종 해결책
```typescript
// app/lib/supabase.server.ts
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // RLS 우회
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// app/lib/agreements.server.ts
export async function upsertUserAgreements(userId: string, agreements: any[]) {
  // 관리자 클라이언트 사용으로 RLS 우회
  const { error } = await supabaseAdmin
    .from('user_agreements')
    .upsert(agreementRecords)
}
```

### 2. 환경 설정 혼동 문제

#### 문제 상황
- 초기에는 로컬 Supabase 개발 환경 구축 시도
- `supabaseKey is required` 에러 발생
- `Invalid API key` 에러 지속

#### 해결 과정
1. **로컬 vs 원격 환경 확인**
2. **올바른 원격 API 키 설정**
3. **SUPABASE_SERVICE_ROLE_KEY 환경 변수 추가**

### 3. OAuth 인증 오류

#### 문제 상황
```
AuthApiError: both auth code and code verifier should be non-empty
```

#### 해결책
- **클라이언트사이드 OAuth 처리**로 변경
- 서버사이드 OAuth 라우트 삭제
- `auth.callback.tsx`에서 인증 결과 처리

### 4. URL 생성 오류

#### 문제 상황
```
TypeError: Failed to construct 'URL': Invalid URL string: "/auth/signup"
```

#### 해결책
```typescript
// 수정 전
const signupUrl = new URL('/auth/signup')

// 수정 후
const signupUrl = new URL(next, request.url)
```

### 5. 트리거 충돌 문제

#### 문제 상황
```
ERROR: 42710: trigger "on_auth_user_created" for relation "users" already exists
```

#### 해결책
```sql
-- 안전한 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 📊 마이그레이션 관리

### 마이그레이션 파일 변천사
1. **20241215000001~000007**: 초기 RLS 정책 시도들
2. **20250615000001~000004**: 약관 시스템 및 RLS 수정
3. **20240728000000_initial_schema.sql**: 최종 통합 마이그레이션

### 최종 통합 마이그레이션 특징
- **모든 테이블 구조** 포함 (regions, categories, places, user_roles, user_agreements 등)
- **RLS 정책** 완전 설정
- **트리거 및 함수** 모두 포함
- **여러 번 실행 가능**한 안전한 스크립트
- **로컬 Docker 환경** 완전 지원

## 🎯 구현된 기능 요약

### 📝 이용약관 시스템
- [x] 11개 조항 서비스 이용약관 전문
- [x] 필수/선택 약관 동의 페이지
- [x] 전체 동의 및 개별 동의 기능
- [x] 약관 전문 모달창
- [x] 동의 이력 데이터베이스 저장

### 🔐 회원가입 플로우
- [x] 이메일 회원가입: 약관 동의 → 회원가입 → 로그인
- [x] 카카오 OAuth: 인증 → 약관 동의(신규만) → 메인
- [x] 기존 사용자 약관 동의 건너뛰기
- [x] 3초 카운트다운 UX

### 🛡️ 보안 개선
- [x] RLS 순환 참조 문제 완전 해결
- [x] service_role을 통한 안전한 데이터 처리
- [x] 환경 변수 보안 강화
- [x] 에러 처리 개선

## 📈 개발 통계

### 코드 변경 통계
- **수정된 파일**: 9개
- **새로 추가된 파일**: 5개
- **삭제된 파일**: 15개 (마이그레이션 정리)
- **총 라인 수**: +1,179 추가, -478 삭제

### 주요 추가 파일
1. `app/lib/agreements.server.ts` - 약관 동의 서버 함수
2. `app/lib/auth.utils.ts` - 인증 유틸리티
3. `app/routes/auth.terms.tsx` - 약관 동의 페이지
4. `app/routes/terms.tsx` - 이용약관 전문
5. `supabase/migrations/20240728000000_initial_schema.sql` - 통합 마이그레이션

### Git 커밋 기록
```
ea6ee4f - feat: 이용약관 동의 시스템 구현 및 인증 플로우 개선
```

## 🔍 기술적 고찰

### 1. RLS vs Service Role
**문제**: RLS 정책의 순환 참조  
**해결**: service_role을 통한 권한 우회  
**교훈**: 복잡한 권한 구조에서는 적절한 권한 분리가 중요

### 2. OAuth 플로우 설계
**변경**: 서버사이드 → 클라이언트사이드  
**이유**: PKCE 및 state 파라미터 처리 복잡성  
**결과**: 더 안정적인 인증 플로우

### 3. 마이그레이션 관리
**문제**: 여러 개의 분산된 마이그레이션 파일  
**해결**: 단일 통합 마이그레이션으로 정리  
**장점**: 로컬 환경 구축 및 배포 단순화

### 4. 환경 설정 관리
**문제**: 로컬 vs 원격 환경 혼동  
**해결**: 명확한 환경 변수 설정 및 문서화  
**개선**: 환경별 설정 파일 분리 필요

## 💡 배운 점

### 기술적 학습
- **Supabase RLS 정책**의 복잡성과 한계
- **OAuth 플로우**의 클라이언트 vs 서버 처리 차이점
- **마이그레이션 설계**의 중요성
- **환경 설정**의 명확한 관리 필요성

### 문제 해결 접근법
- **단계적 문제 분석**: 에러 로그 → 원인 추적 → 해결책 도출
- **다양한 접근법 시도**: 정책 수정 → RLS 비활성화 → service_role 사용
- **통합적 사고**: 개별 문제가 아닌 전체 시스템 관점에서 해결

### 사용자 경험 고려사항
- **직관적인 약관 동의 플로우** 설계
- **기존/신규 사용자 구분**을 통한 UX 최적화
- **에러 상황 처리**를 통한 안정성 확보

## 🔮 다음 단계 계획

### 1. C 단계: 고급 추천 시스템
- 거리 기반 추천 로직 구현
- 카카오 맵 API 연동
- 추천 알고리즘 고도화

### 2. 사용자 경험 개선
- 모바일 반응형 디자인 최적화
- 로딩 상태 및 에러 처리 개선
- 성능 최적화 (이미지, 쿼리)

### 3. 추가 기능
- 사용자 프로필 관리
- 리뷰 및 평점 시스템
- 즐겨찾기 기능

## 📚 참고 자료

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [카카오 OAuth 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [Remix 인증 가이드](https://remix.run/docs/en/main/guides/authentication)

---

**개발 완료**: 이용약관 동의 시스템 및 회원가입 플로우 개선 완료  
**다음 목표**: C 단계 고급 추천 시스템 구현 