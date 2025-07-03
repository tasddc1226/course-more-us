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

### 다음 할 일
1. 탈퇴 사유 통계 대시보드 연결
2. 이메일 찾기 로직을 관리자 문의로 전환하거나 서버 함수화(개인정보 보호)
3. Cypress E2E 테스트 추가 (패스워드 재설정, 회원탈퇴 시나리오)