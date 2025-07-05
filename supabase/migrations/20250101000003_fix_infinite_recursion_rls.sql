-- 🔧 Fix Infinite Recursion in RLS Policies
-- 무한 순환 참조 문제 해결을 위한 RLS 정책 수정
-- 관리자 정책을 서비스 역할 정책으로 변경

-- ============================================================================
-- 1. 기존 문제가 있는 정책들 삭제
-- ============================================================================

-- user_roles 테이블의 문제 정책 삭제
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;

-- 다른 테이블들의 관리자 정책들 삭제
DROP POLICY IF EXISTS "Admins can manage all regions" ON regions;
DROP POLICY IF EXISTS "Admins can manage all categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage all time_slots" ON time_slots;
DROP POLICY IF EXISTS "Admins can manage all places" ON places;
DROP POLICY IF EXISTS "Admins can manage all place_time_slots" ON place_time_slots;
DROP POLICY IF EXISTS "Admins can manage all place_images" ON place_images;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all agreements" ON user_agreements;
DROP POLICY IF EXISTS "Admins can view all recommendation feedback" ON user_recommendation_feedback;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON user_feedback;
DROP POLICY IF EXISTS "Admins can view all favorites" ON user_favorites;
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;

-- ============================================================================
-- 2. 새로운 서비스 역할 기반 정책들 생성
-- ============================================================================

-- 2-1. user_roles 테이블 정책 (순환 참조 방지)
CREATE POLICY "Users can create their own role" ON user_roles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2-2. 기본 데이터 관리 정책 (서비스 역할)
CREATE POLICY "Service role can manage all regions" ON regions 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all categories" ON categories 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all time_slots" ON time_slots 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all places" ON places 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all place_time_slots" ON place_time_slots 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all place_images" ON place_images 
  FOR ALL USING (auth.role() = 'service_role');

-- 2-3. 사용자 데이터 관리 정책 (서비스 역할)
CREATE POLICY "Service role can manage all profiles" ON user_profiles 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all recommendation feedback" ON user_recommendation_feedback 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all feedback" ON user_feedback 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all favorites" ON user_favorites 
  FOR ALL USING (auth.role() = 'service_role');

-- 2-4. Storage 정책 (서비스 역할)
CREATE POLICY "Service role can manage all images" ON storage.objects 
  FOR ALL USING (
    bucket_id = 'place-images' AND 
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 완료 알림
-- ============================================================================

-- 통계 정보 업데이트
ANALYZE;

-- 완료 알림
COMMENT ON SCHEMA public IS 'Course More Us - Fixed infinite recursion in RLS policies on 2025-01-01'; 