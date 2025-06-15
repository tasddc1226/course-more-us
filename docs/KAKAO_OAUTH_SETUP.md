# 카카오 소셜 로그인 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1.1 카카오 개발자 계정 생성
1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. 카카오 계정으로 로그인
3. 개발자 등록 (휴대폰 인증 필요)

### 1.2 애플리케이션 생성
1. **내 애플리케이션** → **애플리케이션 추가하기**
2. 앱 정보 입력:
   - **앱 이름**: 코스모스 (Course-More-Us)
   - **사업자명**: 개인 또는 회사명
   - **카테고리**: 라이프스타일

### 1.3 플랫폼 설정
1. **앱 설정** → **플랫폼**
2. **Web 플랫폼 등록**:
   - **사이트 도메인**: 
     - 개발: `http://localhost:5173`
     - 프로덕션: `https://your-domain.com`

### 1.4 카카오 로그인 활성화
1. **제품 설정** → **카카오 로그인**
2. **활성화 설정** → **ON**
3. **OpenID Connect 활성화** → **ON**
4. **Redirect URI 등록**:
   - 개발: `https://your-project-id.supabase.co/auth/v1/callback`
   - 로컬: `http://127.0.0.1:54321/auth/v1/callback` (로컬 Supabase 사용 시)

### 1.5 동의항목 설정
1. **제품 설정** → **카카오 로그인** → **동의항목**
2. 필수 동의항목:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 선택 동의
   - **카카오계정(이메일)**: 필수 동의

### 1.6 앱 키 확인
1. **앱 설정** → **앱 키**
2. **REST API 키** 복사 (Supabase에서 사용)

## 2. Supabase 설정

### 2.1 Authentication 설정
1. Supabase Dashboard → **Authentication** → **Providers**
2. **Kakao** 찾아서 **Enable** 체크
3. 설정 정보 입력:
   - **Kakao Client ID**: 카카오 REST API 키
   - **Kakao Client Secret**: (카카오는 Client Secret 불필요, 비워둠)

### 2.2 Redirect URLs 설정
1. **Authentication** → **URL Configuration**
2. **Redirect URLs**에 추가:
   - 개발: `http://localhost:5173/auth/callback`
   - 프로덕션: `https://your-domain.com/auth/callback`

## 3. 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. 테스트

### 4.1 로컬 테스트
1. 개발 서버 실행: `npm run dev`
2. `http://localhost:5173/auth/login` 접속
3. **카카오로 로그인** 버튼 클릭
4. 카카오 로그인 페이지에서 로그인
5. 동의 후 메인 페이지로 리다이렉트 확인

### 4.2 사용자 정보 확인
로그인 후 Supabase Dashboard → **Authentication** → **Users**에서 카카오 사용자 정보 확인 가능:
- **Provider**: kakao
- **Email**: 카카오 계정 이메일
- **User Metadata**: 카카오 프로필 정보

## 5. 문제 해결

### 5.1 일반적인 오류

#### "Invalid redirect URI"
- 카카오 개발자 콘솔의 Redirect URI와 Supabase 설정이 일치하는지 확인
- 프로토콜(http/https) 정확히 입력했는지 확인

#### "Client authentication failed"
- 카카오 REST API 키가 올바르게 입력되었는지 확인
- Supabase에서 Kakao Provider가 활성화되었는지 확인

#### "Consent required"
- 카카오 개발자 콘솔에서 필요한 동의항목이 설정되었는지 확인
- 이메일 동의항목이 필수로 설정되었는지 확인

### 5.2 디버깅 팁
1. 브라우저 개발자 도구 → Network 탭에서 OAuth 요청 확인
2. Supabase Dashboard → **Logs**에서 인증 관련 로그 확인
3. 카카오 개발자 콘솔 → **통계** → **카카오 로그인**에서 로그인 시도 확인

## 6. 보안 고려사항

### 6.1 도메인 제한
- 카카오 개발자 콘솔에서 허용된 도메인만 등록
- 프로덕션과 개발 환경 분리

### 6.2 사용자 데이터 처리
- 카카오에서 제공하는 최소한의 정보만 수집
- 개인정보 처리방침 준수
- 사용자 동의 하에 데이터 활용

## 7. 추가 기능

### 7.1 카카오 프로필 정보 활용
```typescript
// 사용자 메타데이터에서 카카오 정보 추출
const { data: { user } } = await supabase.auth.getUser()
if (user?.app_metadata?.provider === 'kakao') {
  const kakaoProfile = user.user_metadata
  // kakaoProfile.avatar_url - 프로필 사진
  // kakaoProfile.full_name - 닉네임
  // kakaoProfile.email - 이메일
}
```

### 7.2 자동 사용자 역할 설정
카카오 로그인 사용자에게 자동으로 'user' 역할 부여하는 트리거 설정 가능

---

이 가이드를 따라 설정하면 카카오 소셜 로그인이 정상적으로 작동합니다. 