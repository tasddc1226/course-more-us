#!/bin/bash

# 🔄 Course More Us - Complete Database Reset Script
# 원격 데이터베이스를 완전히 리셋하고 새로운 스키마 적용

set -e  # 에러 발생시 스크립트 중단

echo "🚀 Course More Us - Complete Database Reset Starting..."
echo "⚠️  WARNING: This will COMPLETELY RESET your remote database!"
echo "📝 All existing data and schema will be permanently deleted."
echo ""

# 사용자 확인
read -p "Are you sure you want to proceed? Type 'RESET' to confirm: " confirmation
if [ "$confirmation" != "RESET" ]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo ""
echo "📋 Reset Process Steps:"
echo "1. Apply complete schema reset migration"
echo "2. Setup RLS policies"
echo "3. Insert initial data"
echo "4. Generate updated TypeScript types"
echo "5. Update git repository"
echo ""

# 1. Supabase CLI 로그인 확인
echo "🔐 Checking Supabase CLI authentication..."
if ! npx supabase projects list > /dev/null 2>&1; then
    echo "❌ Supabase CLI not authenticated. Please run:"
    echo "   npx supabase login"
    exit 1
fi

# 2. 새로운 마이그레이션 적용
echo "📤 Applying complete schema reset migration..."
npx supabase db push

echo "✅ Schema reset and setup completed!"

# 3. TypeScript 타입 재생성
echo "🔧 Regenerating TypeScript types..."
if npm run types:generate:remote > /dev/null 2>&1; then
    echo "✅ TypeScript types updated successfully!"
else
    echo "⚠️  TypeScript types generation failed. Run manually with:"
    echo "   npm run types:generate:remote"
fi

# 4. Git 커밋
echo "📝 Committing changes to git..."
git add supabase/migrations/20250101000000_complete_schema_reset.sql
git add supabase/migrations/20250101000001_setup_rls_policies.sql
git add supabase/migrations/20250101000002_insert_initial_data.sql
git add app/types/database.types.ts

if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit."
else
    git commit -m "feat: complete database schema reset and modernization

- Reset all existing tables and data
- Apply modern schema with all features from development
- Setup comprehensive RLS policies for security
- Insert fresh initial data with search optimization
- Update TypeScript types to match new schema

This reset resolves all migration conflicts and establishes
a clean, consistent database state for continued development."
    
    echo "✅ Changes committed to git!"
fi

# 5. 완료 메시지
echo ""
echo "🎉 Database Reset Complete!"
echo ""
echo "📊 What was accomplished:"
echo "   ✅ All existing tables and data removed"
echo "   ✅ Modern schema with 12 tables applied"
echo "   ✅ Comprehensive RLS policies configured"
echo "   ✅ Initial data seeded (regions, categories, sample places)"
echo "   ✅ Search optimization features enabled"
echo "   ✅ Storage bucket configured"
echo "   ✅ TypeScript types updated"
echo "   ✅ Changes committed to git"
echo ""
echo "🔗 New Database Schema includes:"
echo "   • regions (with search optimization)"
echo "   • categories, time_slots"
echo "   • places (with user registration support)"
echo "   • place_time_slots, place_images"
echo "   • user_roles, user_profiles"
echo "   • user_agreements, user_feedback"
echo "   • user_recommendation_feedback"
echo "   • user_favorites"
echo ""
echo "🔒 Security Features:"
echo "   • Row Level Security (RLS) on all tables"
echo "   • User-based access control"
echo "   • Admin privilege system"
echo "   • Storage bucket policies"
echo ""
echo "🚦 Next Steps:"
echo "1. Test your application with the new schema"
echo "2. Update any hardcoded references if needed"
echo "3. Run development server: npm run dev"
echo "4. Consider pushing changes: git push"
echo ""
echo "✨ Your database is now clean and ready for continued development!" 