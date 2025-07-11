# 코스모스 (Course-More-Us) 🌟

> **특별한 데이트 코스를 추천해드립니다**

코스모스는 사용자의 선호도와 위치를 기반으로 맞춤형 데이트 코스를 추천해주는 웹 서비스입니다. 관리자가 큐레이션한 장소뿐만 아니라 실제 사용자들이 추천하는 데이트 장소를 함께 제공합니다.

## ✨ 주요 기능

### 👤 사용자 기능
- 🔐 **회원가입 / 로그인** - Supabase Auth 기반 안전한 인증 (카카오 소셜 로그인 지원)
- 📍 **지역별 추천** - 6개 주요 지역 (성수동, 광명, 강남, 홍대, 이태원, 명동)
- ⏰ **시간대별 맞춤 추천** - 점심, 오후, 저녁, 밤 시간대 선택
- 🎯 **카테고리별 장소** - 카페, 음식점, 산책로, 펍/바, 문화시설, 쇼핑, 액티비티
- 💳 **가격대 정보** - 1~4단계 가격 범위 표시
- 📝 **장소 등록 기능** - 사용자가 직접 데이트 장소 추천 (하루 최대 3곳)
- 🗺️ **카카오 지도 연동** - 정확한 위치 정보와 검색 기능
- 📸 **이미지 업로드** - 자동 압축으로 최적화된 사진 업로드
- ❤️ **즐겨찾기 시스템** - 마음에 든 장소 북마크 및 관리
- 🔍 **고급 검색 기능** - 태그 기반 검색, 지역 필터링, 실시간 자동완성
- 💬 **사용자 피드백** - 장소별 좋아요/싫어요/방문함 피드백
- 📱 **반응형 디자인** - 모바일/데스크톱 최적화된 UI

### 🔧 관리자 기능
- 📊 **대시보드** - 장소 통계 및 관리 현황, 회원탈퇴 분석
- 🏪 **장소 관리** - CRUD 기능으로 장소 정보 관리
- 👥 **사용자 권한 관리** - 역할 기반 접근 제어
- 🤝 **제휴 업체 설정** - 파트너십 장소 우선 노출

### 🌟 최신 추가 기능 (2025년 업데이트)
- **고급 추천 알고리즘**: 5단계 스코어링 시스템 (제휴 30점 + 평점 25점 + 시간대 20점 + 인기도 15점 + 소스 10점)
- **위치 기반 중복 제거**: GPS 100m 반경 내 동일 장소 통합 관리
- **카테고리 다양성 보장**: 라운드 로빈 방식으로 균형 잡힌 추천
- **실시간 피드백 시스템**: 비동기 처리로 즉시 반영되는 사용자 반응
- **즐겨찾기 시스템**: 하트 버튼으로 간편한 장소 저장 및 관리
- **태그 기반 고급 검색**: 4단계 우선순위 검색 + 실시간 자동완성
- **계정 관리 시스템**: 비밀번호 찾기, 이메일 찾기, 회원탈퇴 기능
- **성능 최적화**: 서버 사이드 캐싱으로 90% API 호출 감소
- **SSR 호환 지도**: 서버 사이드 렌더링 완벽 지원

## 🛠️ 기술 스택

- **Frontend**: Remix (React), TypeScript, Tailwind CSS
- **Backend**: Remix Server Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (카카오/구글 OAuth 지원)
- **Map API**: 카카오 지도 JavaScript SDK
- **File Storage**: Supabase Storage (이미지 업로드)
- **UI/UX**: Tailwind CSS, Canvas Confetti (축하 애니메이션)
- **Type Safety**: TypeScript (완전한 타입 안전성)
- **Performance**: 서버 사이드 메모리 캐싱, 이미지 압축

## 🚀 시작하기

### 필수 요구사항
- Node.js 20+ 
- npm 또는 yarn
- Supabase 계정
- 카카오 개발자 계정 (지도 API용)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/tasddc1226/course-more-us.git
cd course-more-us
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
# .env 파일 생성
# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 세션 설정
SESSION_SECRET=your_random_session_secret

# 카카오 OAuth 설정 (소셜 로그인)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback

# 카카오 지도 API 설정 (지도 기능)
VITE_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
```

4. **데이터베이스 마이그레이션**
```bash
# Supabase CLI 설치 (필요한 경우)
npm install -g supabase

# 마이그레이션 실행
npm run db:push
```

5. **개발 서버 실행**
```bash
npm run dev
```

6. **브라우저에서 확인**
```
http://localhost:3000
```

### 로컬 개발 환경 (Supabase CLI)

1. **Supabase CLI 설치**
```bash
brew install supabase/tap/supabase
```

2. **로컬 Supabase 시작**
```bash
npm run db:start
```

3. **유용한 스크립트들**
```bash
npm run db:stop          # 로컬 DB 중지
npm run db:reset         # 로컬 DB 리셋
npm run db:pull          # 원격 스키마 가져오기
npm run db:push          # 로컬 마이그레이션 원격 적용
npm run types:generate   # 로컬 타입 생성
npm run types:generate:remote  # 원격 타입 생성
```

## 📁 프로젝트 구조

```
course-more-us/
├── app/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 컴포넌트 (지도, 검색, 소셜 로그인 등)
│   │   ├── forms/          # 폼 관련 컴포넌트 (이미지 업로드, 별점 등)
│   │   ├── recommendation/ # 추천 시스템 컴포넌트
│   │   └── ui/            # UI 기본 컴포넌트 (Button, Modal, Calendar 등)
│   ├── lib/               # 서버 사이드 로직
│   │   ├── auth.server.ts     # 인증 관련 함수
│   │   ├── user-places.server.ts # 유저 장소 관리
│   │   ├── favorites.server.ts   # 즐겨찾기 시스템
│   │   ├── search.server.ts      # 고급 검색 기능
│   │   ├── feedback.server.ts    # 사용자 피드백
│   │   ├── cache.server.ts       # 성능 캐싱 시스템
│   │   ├── recommendation/       # 추천 알고리즘 모듈
│   │   │   ├── types.ts         # 추천 시스템 타입
│   │   │   ├── scoring.ts       # 스코어링 로직
│   │   │   ├── grouping.ts      # 위치 기반 그룹화
│   │   │   ├── diversity.ts     # 카테고리 다양성
│   │   │   └── utils.ts         # 유틸리티 함수
│   │   └── supabase.server.ts    # Supabase 연동
│   ├── routes/            # 페이지 라우트
│   │   ├── register-place.tsx    # 장소 등록 페이지
│   │   ├── my-places.tsx         # 내 장소 목록
│   │   ├── my-favorites.tsx      # 즐겨찾기 목록
│   │   ├── search.tsx           # 검색 결과 페이지
│   │   ├── auth/               # 인증 관련 페이지
│   │   └── admin/              # 관리자 페이지
│   ├── types/             # TypeScript 타입 정의
│   │   ├── database.types.ts     # 데이터베이스 타입
│   │   ├── kakao-map.ts          # 카카오 지도 타입
│   │   └── recommendation/       # 추천 시스템 타입
│   └── utils/             # 유틸리티 함수
│       ├── image.ts              # 이미지 압축 함수
│       └── recommendation.ts     # 추천 유틸리티
├── supabase/
│   ├── migrations/        # 데이터베이스 마이그레이션
│   └── config.toml       # Supabase 설정
├── docs/                 # 프로젝트 문서 (11일간의 개발 일지)
└── README.md
```

## 📊 데이터베이스 스키마

### 주요 테이블 (12개)
- **places** - 장소 정보 (관리자 + 유저 등록, 좌표 정보 포함)
- **regions** - 지역 정보 (검색 최적화, 인기 지역 지원)
- **categories** - 카테고리 정보 (7개)
- **time_slots** - 시간대 정보 (4개)
- **place_time_slots** - 장소-시간대 연결
- **place_images** - 장소 이미지 정보
- **user_profiles** - 사용자 프로필 (닉네임, 아바타, 자기소개)
- **user_favorites** - 즐겨찾기 시스템
- **user_roles** - 사용자 권한 관리
- **user_agreements** - 약관 동의 이력
- **user_feedback** - 사용자 피드백 및 계정 삭제 사유
- **user_recommendation_feedback** - 장소별 피드백 (좋아요/싫어요/방문함)

### 고급 기능
- **RLS 정책**: 사용자별 접근 제어
- **Full Text Search**: 고성능 검색 인덱싱
- **GIN 인덱스**: 태그 배열 검색 최적화
- **Trigram 인덱스**: 부분 문자열 검색 향상

## 🔐 권한 시스템

### 사용자 역할
- **admin** - 모든 관리 기능 접근 가능
- **user** - 일반 사용자 기능 + 장소 등록 가능

### 관리자 권한 부여
```sql
-- Supabase Dashboard SQL Editor에서 실행
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'your_email@example.com';
```

## 🗺️ 카카오 지도 API 설정

### 1. 카카오 개발자 콘솔 설정
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. **플랫폼 설정**:
   - Web 플랫폼 추가
   - 도메인 등록: `http://localhost:3000` (개발), 실제 도메인 (운영)
4. **JavaScript 키** 확인 및 복사

### 2. 환경 변수 설정
```env
# VITE_ 접두사 필요 (클라이언트에서 사용)
VITE_KAKAO_MAP_APP_KEY=your_javascript_key_here
```

### 3. 주요 기능
- **장소 검색**: 키워드로 장소 검색
- **위치 선택**: 지도 클릭으로 정확한 위치 설정
- **주소 변환**: 좌표 ↔ 주소 자동 변환
- **SSR 호환**: 서버 사이드 렌더링 완벽 지원

## 📸 이미지 업로드 시스템

### 자동 최적화 기능
- **압축**: 최대 1200x800px, 80% 품질
- **포맷 변환**: JPEG 포맷 자동 변환
- **용량 절약**: 평균 60-80% 파일 크기 감소
- **미리보기**: 실시간 이미지 미리보기
- **제한**: 최대 3장, 10MB 이하

### 저장 구조
- **저장소**: Supabase Storage
- **버킷**: `place-images`
- **경로**: `{user_id}/{timestamp}-{random}.jpg`
- **권한**: RLS 정책으로 보안 관리

## 🔍 고급 검색 시스템

### 4단계 우선순위 검색
1. **이름 정확 매치** (100점)
2. **태그 정확 매치** (90점)
3. **Full Text Search** (80점)
4. **태그 부분 매치** (70점)

### 검색 최적화
- **실시간 자동완성**: 300ms 디바운스
- **인기 태그 시스템**: 빈도수 기반 표시
- **지역 필터링**: 인기 지역 우선 표시
- **병렬 쿼리**: 성능 최적화

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
```

### 배포 옵션
- **Vercel** (추천) - Remix 최적화
- **Netlify** - JAMstack 친화적
- **Railway** - 풀스택 앱 배포

### 환경 변수 설정 (프로덕션)
배포 플랫폼에서 다음 환경 변수들을 설정해야 합니다:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `KAKAO_CLIENT_ID`
- `KAKAO_REDIRECT_URI`
- `VITE_KAKAO_MAP_APP_KEY`

## 📚 문서

### 개발 기록 (11일간의 상세한 개발 일지)
- [1일차 개발 기록](./docs/DAY1_DEVELOPMENT_LOG.md) - 프로젝트 초기 설정 및 관리자 페이지
- [2일차 개발 기록](./docs/DAY2_DEVELOPMENT_LOG.md) - 이용약관 시스템 및 인증 플로우
- [3일차 개발 기록](./docs/DAY3_DEVELOPMENT_LOG.md) - UI/UX 개선 및 공통 컴포넌트
- [4일차 유저 장소 등록 기능](./docs/DAY4_USER_PLACES_FEATURE.md) - 사용자 장소 등록 시스템
- [5일차 카카오 지도 연동](./docs/DAY5_KAKAO_MAP_INTEGRATION.md) - 지도 API 및 이미지 최적화
- [6일차 이미지 업로드 RLS 이슈 해결](./docs/DAY6_IMAGE_UPLOAD_RLS_ISSUE_FIX.md) - Supabase Storage 문제 해결
- [7일차 캘린더 컴포넌트 및 UI 개선](./docs/DAY7_CALENDAR_COMPONENT_AND_UI_IMPROVEMENTS.md) - 프로필 시스템 및 UI 일관성
- [8일차 고급 추천 알고리즘](./docs/DAY8_DEVELOPMENT_LOG.md) - 5단계 스코어링 시스템 완성
- [9일차 성능 최적화](./docs/DAY9_DEVELOPMENT_LOG.md) - 캐싱 시스템 및 모듈 리팩터링
- [10일차 즐겨찾기 & 검색 시스템](./docs/DAY10_DEVELOPMENT_LOG.md) - 즐겨찾기 및 태그 검색 구현
- [11일차 계정 관리 기능](./docs/DAY11_DEVELOPMENT_LOG.md) - 비밀번호 찾기 및 회원탈퇴

### 기술 문서
- [기술적 개요](./docs/TECHNICAL_OVERVIEW.md)
- [프로젝트 구조](./docs/PROJECT_STRUCTURE.md)
- [카카오 OAuth 설정](./docs/KAKAO_OAUTH_SETUP.md)
- [기능 격차 분석](./docs/FEATURE_GAP_ANALYSIS.md)
- [배포 워크플로우](./docs/DEPLOYMENT_WORKFLOW.md)

## 🎯 사용법

### 일반 사용자
1. **회원가입/로그인**: 카카오 계정 또는 이메일로 가입
2. **지역 선택**: 원하는 데이트 지역 선택
3. **시간대 선택**: 데이트 시간대 선택 (점심/오후/저녁/밤)
4. **추천 받기**: 고급 알고리즘으로 맞춤형 데이트 코스 추천
5. **즐겨찾기**: 마음에 든 장소 하트 버튼으로 저장
6. **장소 검색**: 태그나 이름으로 원하는 장소 검색
7. **장소 등록**: "내 장소" 메뉴에서 새로운 데이트 장소 추천

### 장소 등록 방법
1. **지도에서 위치 선택**: 카카오 지도에서 원하는 위치 클릭
2. **기본 정보 입력**: 카테고리, 한줄 설명, 별점 작성
3. **사진 업로드**: 1-3장의 사진 업로드 (자동 압축)
4. **태그 설정**: 최대 5개의 태그로 장소 특성 표현
5. **등록 완료**: 하루 최대 3곳까지 등록 가능

### 검색 및 즐겨찾기
1. **고급 검색**: 메인 페이지 상단의 검색바 활용
2. **태그 자동완성**: 실시간으로 인기 태그 제안
3. **지역 필터**: 특정 지역만 검색 가능
4. **즐겨찾기 관리**: 프로필 메뉴에서 "내 즐겨찾기" 확인

### 관리자
1. **대시보드**: `/admin`에서 전체 현황 및 회원탈퇴 분석
2. **장소 관리**: 장소 추가/수정/삭제
3. **사용자 관리**: 사용자 권한 및 프로필 관리
4. **제휴 업체**: 파트너십 장소 설정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 알려진 이슈

### 해결된 이슈
- ✅ 이미지 업로드 RLS 정책 문제 해결
- ✅ 카카오 지도 SSR 호환성 문제 해결
- ✅ 사용자 권한 분리 문제 해결
- ✅ Rate Limit 문제 해결 (90% API 호출 감소)
- ✅ 추천 알고리즘 타입 안전성 문제 해결
- ✅ 플로팅 액션 버튼 UX 개선

### 최근 개선사항
- 🔄 고급 추천 알고리즘 완성 (5단계 스코어링)
- 🔄 성능 최적화 (서버 사이드 캐싱)
- 🔄 모듈 구조 대규모 리팩터링
- 🔄 즐겨찾기 및 검색 시스템 완성

## 📈 성과 지표

### 기술적 성취
- **완전한 추천 시스템**: 위치 기반 중복 제거 + 5단계 스코어링
- **고급 검색 시스템**: 4단계 우선순위 검색 + 실시간 자동완성
- **성능 최적화**: 90% API 호출 감소, 서버 사이드 캐싱
- **사용자 경험**: 즐겨찾기, 피드백, 회원탈퇴 등 완전한 사용자 관리
- **컴포넌트 재사용성**: 15개 공통 UI 컴포넌트 구축
- **타입 안전성**: 100% TypeScript 커버리지
- **이미지 최적화**: 60-80% 압축률 달성
- **모바일 친화적**: 완전한 반응형 디자인

### 개발 효율성
- **체계적 문서화**: 11일간의 상세한 개발 일지
- **모듈화된 아키텍처**: 확장성 있는 5개 모듈 분리
- **자동화된 스크립트**: DB 관리 및 타입 생성 자동화
- **보안 강화**: RLS 정책과 서비스 역할 적절한 활용

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

- **개발자**: yangsuyoung
- **이메일**: tasddc@naver.com
- **프로젝트 링크**: [https://github.com/tasddc1226/course-more-us](https://github.com/tasddc1226/course-more-us)

---

**현재 상태**: 모든 핵심 기능 완성 (2025년 1월)
**다음 단계**: PWA 구현, 실시간 알림, 소셜 기능 확장
