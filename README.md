# 코스모스 (Course-More-Us) 🌟

> **특별한 데이트 코스를 추천해드립니다**

코스모스는 사용자의 선호도와 위치를 기반으로 맞춤형 데이트 코스를 추천해주는 웹 서비스입니다.

## ✨ 주요 기능

### 👤 사용자 기능
- 🔐 **회원가입 / 로그인** - Supabase Auth 기반 안전한 인증
- 📍 **지역별 추천** - 6개 주요 지역 (성수동, 광명, 강남, 홍대, 이태원, 명동)
- ⏰ **시간대별 맞춤 추천** - 점심, 오후, 저녁, 밤 시간대 선택
- 🎯 **카테고리별 장소** - 카페, 음식점, 산책로, 펍/바, 문화시설, 쇼핑, 액티비티
- 💳 **가격대 정보** - 1~4단계 가격 범위 표시

### 🔧 관리자 기능
- 📊 **대시보드** - 장소 통계 및 관리 현황
- 🏪 **장소 관리** - CRUD 기능으로 장소 정보 관리
- 👥 **사용자 권한 관리** - 역할 기반 접근 제어
- 🤝 **제휴 업체 설정** - 파트너십 장소 우선 노출

## 🛠️ 기술 스택

- **Frontend**: Remix (React), TypeScript, Tailwind CSS
- **Backend**: Remix Server Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정

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
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **개발 서버 실행**
```bash
npm run dev
```

5. **브라우저에서 확인**
```
http://localhost:5173
```

### 로컬 개발 환경 (Supabase CLI)

1. **Supabase CLI 설치**
```bash
brew install supabase/tap/supabase
```

2. **로컬 Supabase 시작**
```bash
supabase start
```

3. **환경 변수 업데이트**
```bash
# 로컬 개발용
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=로컬_anon_key
```

## 📁 프로젝트 구조

```
course-more-us/
├── app/
│   ├── lib/                    # 서버 사이드 로직
│   ├── routes/                 # 페이지 라우트
│   ├── types/                  # TypeScript 타입 정의
│   └── root.tsx               # 앱 루트
├── supabase/
│   ├── migrations/            # 데이터베이스 마이그레이션
│   ├── schema.sql            # 데이터베이스 스키마
│   └── seed.sql              # 초기 데이터
├── docs/                     # 프로젝트 문서
└── README.md
```

## 📊 데이터베이스 스키마

### 주요 테이블
- **regions** - 지역 정보 (6개)
- **categories** - 카테고리 정보 (7개)
- **time_slots** - 시간대 정보 (4개)
- **places** - 장소 정보 (메인 테이블)
- **place_time_slots** - 장소-시간대 연결
- **user_roles** - 사용자 권한 관리

## 🔐 권한 시스템

### 사용자 역할
- **admin** - 모든 관리 기능 접근 가능
- **user** - 일반 사용자 기능만 접근 가능

### 관리자 권한 부여
```sql
-- Supabase Dashboard SQL Editor에서 실행
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'your_email@example.com';
```

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
```

### 배포 옵션
- **Vercel** (추천) - Remix 최적화
- **Netlify** - JAMstack 친화적
- **Railway** - 풀스택 앱 배포

## 📚 문서

- [1일차 개발 기록](./docs/DAY1_DEVELOPMENT_LOG.md)
- [기술적 개요](./docs/TECHNICAL_OVERVIEW.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

- **개발자**: yangsuyoung
- **이메일**: tasddc@naver.com
- **프로젝트 링크**: [https://github.com/tasddc1226/course-more-us](https://github.com/tasddc1226/course-more-us)

---

**다음 단계**: C 단계 고급 기능 구현 (지도 통합 및 추천 알고리즘 고도화)
