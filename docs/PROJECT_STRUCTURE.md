# 프로젝트 구조 가이드

> **코스모스 (Course-More-Us)** - 데이트 코스 추천 서비스

## 📁 디렉토리 구조

```
course-more-us/
├── app/                          # 메인 애플리케이션 코드
│   ├── components/               # 재사용 가능한 컴포넌트
│   │   ├── ui/                  # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx       # 버튼 컴포넌트
│   │   │   ├── Input.tsx        # 입력 필드 컴포넌트
│   │   │   ├── Modal.tsx        # 모달 컴포넌트
│   │   │   └── index.ts         # UI 컴포넌트 export
│   │   ├── forms/               # 폼 관련 컴포넌트
│   │   ├── admin/               # 관리자 전용 컴포넌트
│   │   └── common/              # 공통 컴포넌트
│   ├── lib/                     # 서버 사이드 로직
│   │   ├── admin.server.ts      # 관리자 기능
│   │   ├── agreements.server.ts # 약관 동의 관리
│   │   ├── auth.server.ts       # 인증 로직
│   │   ├── auth.utils.ts        # 인증 유틸리티
│   │   ├── recommendation.server.ts # 추천 시스템
│   │   ├── supabase.client.ts   # Supabase 클라이언트
│   │   └── supabase.server.ts   # Supabase 서버
│   ├── routes/                  # 페이지 라우트
│   │   ├── _index.tsx           # 메인 페이지
│   │   ├── auth.*.tsx           # 인증 관련 페이지
│   │   ├── admin.*.tsx          # 관리자 페이지
│   │   ├── terms.tsx            # 이용약관
│   │   ├── privacy.tsx          # 개인정보처리방침
│   │   └── $.tsx                # 404 캐치올 라우트
│   ├── types/                   # TypeScript 타입 정의
│   │   ├── database/            # 데이터베이스 관련 타입
│   │   │   └── database.types.ts # Supabase 자동 생성 타입
│   │   ├── auth/                # 인증 관련 타입
│   │   │   └── index.ts         # User, UserRole, UserAgreement
│   │   ├── forms/               # 폼 관련 타입
│   │   │   └── index.ts         # FormData, FormError 등
│   │   └── admin/               # 관리자 관련 타입
│   ├── utils/                   # 공통 유틸리티 함수
│   │   ├── date.ts              # 날짜 관련 함수
│   │   └── validation.ts        # 유효성 검사 함수
│   ├── constants/               # 상수 정의
│   │   ├── agreements.ts        # 약관 관련 상수
│   │   └── routes.ts            # 라우트 경로 상수
│   ├── config/                  # 설정 파일
│   │   └── env.ts               # 환경 변수 관리
│   ├── hooks/                   # React 커스텀 훅 (향후 추가)
│   ├── entry.client.tsx         # 클라이언트 진입점
│   ├── entry.server.tsx         # 서버 진입점
│   ├── root.tsx                 # 루트 컴포넌트
│   └── tailwind.css             # Tailwind CSS
├── supabase/                    # Supabase 설정
│   ├── migrations/              # 데이터베이스 마이그레이션
│   │   └── 20240728000000_initial_schema.sql
│   ├── config.toml              # Supabase 설정
│   ├── schema.sql               # 현재 스키마
│   └── seed.sql                 # 시드 데이터
├── docs/                        # 프로젝트 문서
│   ├── DAY1_DEVELOPMENT_LOG.md  # 1일차 개발 로그
│   ├── DAY2_DEVELOPMENT_LOG.md  # 2일차 개발 로그
│   ├── TECHNICAL_OVERVIEW.md    # 기술 개요
│   ├── KAKAO_OAUTH_SETUP.md     # 카카오 OAuth 설정
│   └── PROJECT_STRUCTURE.md     # 프로젝트 구조 (현재 파일)
├── scripts/                     # 유틸리티 스크립트
│   └── reset-and-migrate.sh     # DB 리셋 및 마이그레이션
├── public/                      # 정적 파일
│   ├── favicon.ico              # 파비콘
│   ├── logo-dark.png           # 다크 로고
│   └── logo-light.png          # 라이트 로고
├── package.json                 # 프로젝트 의존성
├── package-lock.json            # 잠금 파일
├── vite.config.ts              # Vite 설정
├── tailwind.config.ts          # Tailwind 설정
├── tsconfig.json               # TypeScript 설정
├── .eslintrc.cjs               # ESLint 설정
├── postcss.config.js           # PostCSS 설정
├── .gitignore                  # Git 무시 파일
├── LICENSE                     # 라이선스
└── README.md                   # 프로젝트 README
```

## 🎯 구조 설계 원칙

### 1. 관심사 분리 (Separation of Concerns)
- **components/**: UI 컴포넌트만 담당
- **lib/**: 비즈니스 로직 및 서버 함수
- **utils/**: 순수 함수 유틸리티
- **constants/**: 상수 정의

### 2. 기능별 분류 (Feature-based Organization)
- **auth/**: 인증 관련 모든 요소
- **admin/**: 관리자 기능 관련 요소
- **ui/**: 재사용 가능한 UI 컴포넌트

### 3. 타입 안전성 (Type Safety)
- **types/**: 기능별로 분리된 타입 정의
- **database.types.ts**: Supabase 자동 생성 타입
- 각 모듈별 인터페이스 정의

### 4. 환경 설정 중앙화
- **config/env.ts**: 모든 환경 변수 중앙 관리
- 타입 안전한 환경 변수 접근
- 필수 변수 검증 로직

## 📋 파일 명명 규칙

### 컴포넌트
- **PascalCase**: `Button.tsx`, `Modal.tsx`
- **기능.확장자**: `UserProfile.tsx`

### 유틸리티 및 라이브러리
- **camelCase**: `auth.server.ts`, `date.utils.ts`
- **기능.타입.확장자**: `validation.utils.ts`

### 상수 및 설정
- **camelCase**: `routes.ts`, `agreements.ts`
- **설명적 이름**: `env.config.ts`

### 타입 정의
- **index.ts**: 각 디렉토리의 주요 export
- **기능별 분리**: `auth/index.ts`, `forms/index.ts`

## 🔄 Import/Export 패턴

### 절대 경로 사용
```typescript
// ✅ 좋은 예
import { Button, Input } from '~/components/ui';
import { ROUTES } from '~/constants/routes';
import { validateEmail } from '~/utils/validation';

// ❌ 나쁜 예
import { Button } from '../../../components/ui/Button';
```

### 인덱스 파일 활용
```typescript
// components/ui/index.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Modal } from './Modal';

// 사용
import { Button, Input, Modal } from '~/components/ui';
```

### 타입과 구현체 분리
```typescript
// types/auth/index.ts에서 타입 정의
export interface LoginFormData { ... }

// lib/auth.server.ts에서 구현
import type { LoginFormData } from '~/types/auth';
```

## 🚀 확장 가이드

### 새로운 기능 추가 시
1. **types/** 에 관련 타입 정의
2. **constants/** 에 필요한 상수 추가
3. **lib/** 에 서버 로직 구현
4. **components/** 에 UI 컴포넌트 생성
5. **routes/** 에 페이지 라우트 추가

### 컴포넌트 추가 시
1. 적절한 디렉토리 선택 (ui/forms/admin/common)
2. 타입 정의 먼저 작성
3. 재사용성을 고려한 prop 설계
4. 접근성(a11y) 고려

### 유틸리티 함수 추가 시
1. 순수 함수로 작성
2. 단일 책임 원칙 준수
3. 타입 안전성 보장
4. 테스트 가능하도록 설계

## 💡 베스트 프랙티스

### 코드 품질
- **TypeScript strict mode** 사용
- **ESLint + Prettier** 설정 준수
- **명확한 변수명과 함수명** 사용
- **JSDoc 주석** 추가

### 성능 최적화
- **lazy loading** 적절히 활용
- **메모이제이션** 필요시 적용
- **번들 크기** 모니터링
- **이미지 최적화**

### 보안
- **환경 변수** 안전한 관리
- **타입 검증** 서버사이드에서 수행
- **XSS 방지** 적절한 이스케이핑
- **CSRF 보호** 토큰 사용

---

**마지막 업데이트**: 2025년 6월 16일  
**구조 버전**: v2.0 (정리 완료) 