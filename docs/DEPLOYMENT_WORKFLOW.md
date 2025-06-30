# 🚀 배포 및 스키마 동기화 워크플로우

## 📋 개발 환경 설정

### 1. 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 필수 환경변수 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_project_id
```

### 2. Supabase CLI 로그인
```bash
npx supabase login
npx supabase link --project-ref your_project_id
```

## 🔄 스키마 동기화 프로세스

### **방법 1: 원격 → 로컬 (신규 개발자 합류시)**
```bash
# 1. 원격 스키마를 로컬로 가져오기
npm run db:pull

# 2. 로컬 환경 시작
npm run db:start

# 3. 마이그레이션 적용
npm run db:migrate

# 4. 타입 생성
npm run types:generate
```

### **방법 2: 로컬 → 원격 (새로운 스키마 변경사항 배포)**
```bash
# 1. 스키마 변경사항을 마이그레이션으로 생성
npx supabase db diff -f new_feature_name

# 2. 로컬에서 테스트
npm run db:reset
npm run db:migrate

# 3. 원격으로 푸시
npm run db:push

# 4. 타입 재생성
npm run types:generate:remote
```

## 🎯 이상적인 개발 워크플로우

### **일상적인 개발**
```bash
# 1. 개발 시작
npm run db:start
npm run dev

# 2. 스키마 변경이 있다면
npx supabase db diff -f feature_name
git add supabase/migrations/
git commit -m "feat: add new migration"

# 3. 다른 개발자 변경사항 받기
git pull
npm run db:reset  # 최신 마이그레이션 반영
```

### **프로덕션 배포**
```bash
# 1. 마이그레이션 검증
npm run db:diff  # 변경사항 확인

# 2. 스테이징 환경 테스트
npm run db:push  # 스테이징 환경에 적용

# 3. 프로덕션 배포
# CI/CD에서 자동으로 supabase db push 실행
```

## 🛠 브랜치별 환경 관리

### **환경별 설정**
- **로컬**: `supabase start`로 Docker 환경
- **개발**: 별도 Supabase 프로젝트
- **스테이징**: 프로덕션과 동일한 설정
- **프로덕션**: 메인 Supabase 프로젝트

### **Supabase 브랜치 활용**
```bash
# 새로운 기능 개발시 브랜치 생성
npx supabase branches create feature-branch

# 브랜치에서 작업
npx supabase db push --branch feature-branch

# 메인으로 머지
npx supabase branches merge feature-branch
```

## 🚨 트러블슈팅

### **스키마 충돌 해결**
```bash
# 1. 현재 상태 백업
npx supabase db dump > backup.sql

# 2. 리셋 후 재적용
npm run db:reset
npm run db:migrate

# 3. 타입 재생성
npm run types:generate
```

### **마이그레이션 롤백**
```bash
# 특정 마이그레이션으로 롤백
npx supabase migration repair --status reverted --version 20240101000000

# 리셋 후 재적용
npm run db:reset
```

## 📝 베스트 프랙티스

### **마이그레이션 규칙**
1. **원자적 변경**: 하나의 마이그레이션에는 관련된 변경사항만
2. **되돌릴 수 있는 변경**: DROP보다는 비활성화 컬럼 추가
3. **명확한 네이밍**: `20240101000000_add_user_profiles_table.sql`
4. **테스트**: 로컬에서 충분히 테스트 후 배포

### **Git 워크플로우**
```bash
# 1. 피처 브랜치 생성
git checkout -b feature/new-schema

# 2. 스키마 변경 후 마이그레이션 생성
npx supabase db diff -f add_new_table

# 3. 커밋
git add supabase/migrations/
git commit -m "feat: add new table for feature X"

# 4. PR 생성 및 리뷰
# 5. 머지 후 자동 배포
```

### **환경별 설정 관리**
- `.env.local` - 로컬 개발용
- `.env.development` - 개발 서버용  
- `.env.production` - 프로덕션용

각 환경에 맞는 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 설정 