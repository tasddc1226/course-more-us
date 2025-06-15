#!/bin/bash

# 코스모스 프로젝트 - 원격 Supabase 리셋 및 마이그레이션 스크립트
# 생성일: 2025년 6월 15일

echo "🚀 코스모스 프로젝트 - 원격 Supabase 리셋 및 마이그레이션 시작"
echo "=================================================="

# 1. 현재 원격 데이터베이스 상태 확인
echo "📊 현재 원격 데이터베이스 상태 확인 중..."
npx supabase db pull --schema public

if [ $? -eq 0 ]; then
    echo "✅ 원격 데이터베이스 연결 성공"
else
    echo "❌ 원격 데이터베이스 연결 실패. 연결 설정을 확인해주세요."
    exit 1
fi

# 2. 사용자 확인
echo ""
echo "⚠️  경고: 이 작업은 원격 데이터베이스의 모든 데이터를 삭제합니다!"
echo "   - 모든 테이블과 데이터가 삭제됩니다."
echo "   - 사용자 계정 정보도 초기화됩니다."
echo "   - 이 작업은 되돌릴 수 없습니다."
echo ""
read -p "정말로 계속하시겠습니까? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ 작업이 취소되었습니다."
    exit 0
fi

# 3. 원격 데이터베이스 리셋
echo ""
echo "🔄 원격 데이터베이스 리셋 중..."
npx supabase db reset --linked

if [ $? -eq 0 ]; then
    echo "✅ 원격 데이터베이스 리셋 완료"
else
    echo "❌ 원격 데이터베이스 리셋 실패"
    exit 1
fi

# 4. 새로운 마이그레이션 적용
echo ""
echo "📦 새로운 통합 마이그레이션 적용 중..."
npx supabase db push

if [ $? -eq 0 ]; then
    echo "✅ 마이그레이션 적용 완료"
else
    echo "❌ 마이그레이션 적용 실패"
    exit 1
fi

# 5. 시드 데이터 적용 (선택사항)
echo ""
read -p "시드 데이터를 적용하시겠습니까? (y/n): " apply_seed

if [ "$apply_seed" = "y" ] || [ "$apply_seed" = "yes" ]; then
    echo "🌱 시드 데이터 적용 중..."
    
    # Supabase 대시보드의 SQL Editor에서 실행하라는 안내
    echo ""
    echo "📋 시드 데이터를 적용하려면 다음 단계를 따라주세요:"
    echo "1. Supabase 대시보드 접속: https://supabase.com/dashboard"
    echo "2. SQL Editor 열기"
    echo "3. 아래 파일의 내용을 복사해서 실행:"
    echo "   📁 supabase/seed.sql"
    echo ""
    echo "📄 시드 데이터 내용:"
    echo "   - 지역 데이터 (성수동, 광명, 강남 등)"
    echo "   - 카테고리 데이터 (카페, 음식점, 산책로 등)"
    echo "   - 시간대 데이터 (점심, 오후, 저녁, 밤)"
    echo "   - 샘플 장소 데이터 (블루보틀 커피, 언더스탠드 에비뉴 등)"
    echo ""
else
    echo "⏩ 시드 데이터 적용을 건너뜁니다."
fi

# 6. 완료 메시지
echo ""
echo "🎉 원격 Supabase 리셋 및 마이그레이션 완료!"
echo "=================================================="
echo ""
echo "📋 다음 단계:"
echo "1. 개발 서버 실행: npm run dev"
echo "2. 관리자 계정 생성 (카카오 로그인 후):"
echo "   - 로그인 후 Supabase 대시보드에서 SQL 실행:"
echo "   - UPDATE user_roles SET role = 'admin' WHERE user_id = '당신의_사용자_ID';"
echo "3. 관리자 페이지 접속: http://localhost:5173/admin"
echo ""
echo "🔗 유용한 링크:"
echo "   - Supabase 대시보드: https://supabase.com/dashboard"
echo "   - 로컬 개발 서버: http://localhost:5173"
echo "   - 관리자 페이지: http://localhost:5173/admin"
echo ""
echo "✨ 코스모스 프로젝트가 성공적으로 설정되었습니다!" 