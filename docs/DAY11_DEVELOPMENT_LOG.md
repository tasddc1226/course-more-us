# DAY11 개발 로그 – 2025-07-03

## 브랜치
* `day11/user-email-password-find` 생성 후 모든 작업 진행.

---

## 1. 이메일 / 비밀번호 찾기 기능
### 라우트 & 상수
* `app/constants/routes.ts`
  * `FORGOT_PASSWORD` → `/auth/forgot-password`
  * `RESET_PASSWORD`   → `/auth/reset-password`
  * `AUTH_ROUTES`, `PUBLIC_ROUTES` 에 두 경로 추가
* `auth.login.tsx` 의 링크를 상수 사용으로 교체

### 페이지 구현
| 파일 | 주요 내용 |
|------|----------|
| `app/routes/auth.forgot-password.tsx` | 1) 탭 UI(`비밀번호 재설정`, `이메일 찾기`) <br/>2) `supabase.auth.resetPasswordForEmail()` 호출 (redirect → `/auth/reset-password`) <br/>3) 닉네임으로 이메일 찾기(보안상 실제 주소 미노출) |
| `app/routes/auth.reset-password.tsx` | 1) 세션 검증 후 새 비밀번호 입력 <br/>2) `supabase.auth.updateUser()` 로 업데이트 |

### UI
* 공통 컴포넌트 `AuthLayout`, `Input`, `Button`, `ErrorMessage`, `Modal` 적극 활용
* 디자인 시스템(rounded-xl, gradient 버튼 등) 준수

---

## 2. 회원탈퇴(계정 삭제) 플로우
### UI 변경 – `/my-info`
* 로그아웃 버튼 아래 `회원탈퇴` 버튼 추가
* 2-Step Modal
  1. **확인 모달** – 되돌릴 수 없음 안내
  2. **탈퇴 사유 모달** – 10자 이하 입력 후 `탈퇴하기`

### 서버 액션
* `action`에 `deleteAccount` 분기 추가
  * 사유 검증(1~10자)
  * `supabase.auth.signOut()` → 세션 쿠키 정리
  * `deleteUserAndData(user.id, reason)` 호출
  * 홈(`/`) 리다이렉트

### 공통 로직
* `app/lib/delete-account.server.ts`
  * 탈퇴 사유를 `user_feedback` 테이블(`account_deletion`)에 저장
  * `user_roles` 정리
  * `supabaseAdmin.auth.admin.deleteUser()` 로 Auth 유저 제거 (CASCADE로 관련 데이터 삭제)

---

## 3. 기타 리팩터
* `Button`-variant 재사용(`danger`, `outline`)으로 모달 액션 통일
* 불필요한 하드코딩 제거 → `ROUTES` 상수 사용 일관화
* day11 작업은 **커밋/푸시 미실행** (사용자 직접 진행 예정)

---

## 세부 작업 계획 (다음 단계)

### 1) 탈퇴 사유 통계 대시보드 연결
1. DB: `user_feedback` → `title = 'account_deletion'` 레코드 집계 (reason 별 count)
2. `app/lib/admin.server.ts` – `getAccountDeletionStats()` 함수 추가 (service key)
3. `app/routes/admin._index.tsx` loader 확장 → stats 반환
4. UI: 관리자 대시보드에 카드/테이블 표시 (reason + 개수)
5. 차트 라이브러리(Optional): `@nivo/line` or simple bar with Tailwind

### 2) 이메일 찾기 로직 서버 사이드 전환
1. API 라우트 `app/routes/api.account.find-email.tsx` 생성
   * POST `{ nickname }` → 서버에서 supabaseAdmin로 매칭 후 masked email 반환 (ex: a***b@domain.com)
2. 클라이언트: `auth.forgot-password.tsx` 에서 닉네임 제출 시 fetch API 호출
3. 실패 시 공통 에러 처리(`ErrorMessage`)
4. RLS 보호 → 서버 키 사용, 응답은 마스킹된 이메일만

### 3) Cypress E2E 테스트
1. `devDependencies` – `cypress` 설치, `package.json` 스크립트(`cy:open`, `cy:run`)
2. 기본 설정: `cypress.config.ts` 추가 (baseUrl = `http://localhost:3000`)
3. 테스트: `cypress/e2e/password-reset.cy.ts`
   * 사용자 Signup → ForgotPassword → intercept reset link → Reset Password
4. 테스트: `cypress/e2e/account-delete.cy.ts`
   * 로그인 → /my-info → 탈퇴 플로우 → expect redirect to /, account removed
5. CI 연동 (GitHub Actions): `cypress-io/github-action`