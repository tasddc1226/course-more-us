# Vercel 배포 가이드

이 프로젝트는 Remix 프레임워크를 사용하며, Vercel을 통해 배포할 수 있도록 구성되어 있습니다. 메인 브랜치에 코드가 병합되면 자동으로 배포됩니다.

## 🚀 배포 설정

### 1. Vercel 프로젝트 설정

1. [Vercel](https://vercel.com)에 로그인
2. GitHub 저장소를 연결하여 새 프로젝트 생성
3. Framework Preset: **Remix** 선택
4. Root Directory: `.` (기본값)
5. Build and Output Settings는 자동으로 감지됩니다

### 2. 환경 변수 설정

Vercel 대시보드의 **Settings > Environment Variables**에서 다음 환경 변수들을 설정하세요:

#### 필수 환경 변수
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_super_secret_session_key_32_characters_plus
BASE_URL=https://your-app.vercel.app
```

#### Kakao API 설정 (필수)
```
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_REDIRECT_URI=https://your-app.vercel.app/auth/kakao/callback
VITE_KAKAO_MAP_APP_KEY=your_kakao_map_app_key
```

#### Google OAuth 설정 (선택)
```
GOOGLE_CLIENT_ID=your_google_client_id
```

#### 이메일 설정 (선택)
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_email@example.com
DEVELOPER_EMAIL=developer@example.com
```

#### OpenAI 설정 (선택)
```
OPENAI_API_KEY=your_openai_api_key
```

### 3. GitHub Secrets 설정

GitHub Actions 자동 배포를 위해 다음 Secrets를 설정하세요:

1. GitHub 저장소의 **Settings > Secrets and variables > Actions**로 이동
2. 다음 secrets을 추가:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Vercel Token 획득 방법:
1. [Vercel Account Settings](https://vercel.com/account/tokens)에서 새 토큰 생성
2. Token name: `GitHub Actions`
3. Expiration: `No Expiration` 또는 적절한 기간 설정

#### Vercel Org ID & Project ID 획득 방법:
1. 터미널에서 프로젝트 루트로 이동
2. `npx vercel link` 실행하여 프로젝트 연결
3. `.vercel/project.json` 파일에서 `orgId`와 `projectId` 확인

## 🔄 자동 배포 프로세스

### Pull Request 시
- Preview 배포가 자동으로 생성됩니다
- 테스트 환경에서 변경사항을 확인할 수 있습니다

### Main 브랜치 병합 시
- Production 배포가 자동으로 실행됩니다
- 실제 서비스에 변경사항이 반영됩니다

## 📋 배포 전 체크리스트

- [ ] Supabase 프로젝트가 설정되어 있는지 확인
- [ ] 모든 환경 변수가 Vercel에 설정되어 있는지 확인
- [ ] Kakao API 콘솔에서 도메인이 등록되어 있는지 확인
- [ ] Google OAuth 콘솔에서 도메인이 등록되어 있는지 확인 (사용하는 경우)
- [ ] GitHub Secrets가 모두 설정되어 있는지 확인

## 🛠️ 로컬 개발 환경 설정

1. `.env.example`을 복사하여 `.env` 파일 생성:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일의 환경 변수들을 실제 값으로 설정

3. 의존성 설치 및 개발 서버 실행:
   ```bash
   npm install
   npm run db:start  # Supabase 로컬 개발 환경 시작
   npm run dev       # 개발 서버 시작
   ```

## 🐛 트러블슈팅

### 배포 실패 시
1. Vercel 대시보드에서 빌드 로그 확인
2. 환경 변수 설정 재확인
3. GitHub Actions 로그 확인

### 환경 변수 관련 오류
- 모든 필수 환경 변수가 설정되어 있는지 확인
- 특수 문자가 포함된 값은 따옴표로 감싸기
- 프로덕션과 개발 환경의 URL 차이 확인

### Supabase 연결 오류
- SUPABASE_URL과 SUPABASE_ANON_KEY가 올바른지 확인
- Supabase 프로젝트의 RLS(Row Level Security) 정책 확인

## 📞 지원

배포 중 문제가 발생하면 다음을 확인하세요:
- [Vercel 문서](https://vercel.com/docs)
- [Remix 배포 가이드](https://remix.run/docs/en/main/guides/deployment)
- [GitHub Actions 문서](https://docs.github.com/en/actions)