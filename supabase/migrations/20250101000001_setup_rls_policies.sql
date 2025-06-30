-- 🔒 Course More Us - Row Level Security (RLS) Policies Setup
-- 모든 테이블에 대한 보안 정책 설정
-- 생성일: 2025년 1월 1일 (스키마 리셋 직후)

-- ============================================================================
-- 1. 기본 데이터 조회 정책 (Public Access)
-- ============================================================================

-- 1-1. 지역 정보 - 모든 사용자 조회 가능
CREATE POLICY "Anyone can view regions" ON regions FOR SELECT USING (true);

-- 1-2. 카테고리 정보 - 모든 사용자 조회 가능
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- 1-3. 시간대 정보 - 모든 사용자 조회 가능
CREATE POLICY "Anyone can view time_slots" ON time_slots FOR SELECT USING (true);

-- 1-4. 장소-시간대 연결정보 - 모든 사용자 조회 가능
CREATE POLICY "Anyone can view place_time_slots" ON place_time_slots FOR SELECT USING (true);

-- 1-5. 장소 이미지 - 모든 사용자 조회 가능
CREATE POLICY "Anyone can view place_images" ON place_images FOR SELECT USING (true);

-- ============================================================================
-- 2. 장소(Places) 관련 정책
-- ============================================================================

-- 2-1. 활성화된 장소는 모든 사용자 조회 가능
CREATE POLICY "Anyone can view active places" ON places 
  FOR SELECT USING (is_active = true);

-- 2-2. 사용자는 자신이 등록한 장소(비활성화 포함) 조회 가능
CREATE POLICY "Users can view their own places" ON places 
  FOR SELECT USING (user_id = auth.uid());

-- 2-3. 인증된 사용자는 장소 등록 가능 (사용자 source만)
CREATE POLICY "Authenticated users can insert places" ON places 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    source = 'user' AND 
    user_id = auth.uid()
  );

-- 2-4. 사용자는 자신이 등록한 장소만 수정 가능
CREATE POLICY "Users can update their own places" ON places 
  FOR UPDATE USING (
    user_id = auth.uid() AND source = 'user'
  ) WITH CHECK (
    user_id = auth.uid() AND source = 'user'
  );

-- 2-5. 사용자는 자신이 등록한 장소만 삭제 가능
CREATE POLICY "Users can delete their own places" ON places 
  FOR DELETE USING (
    user_id = auth.uid() AND source = 'user'
  );

-- ============================================================================
-- 3. 서비스 역할 관리 정책 (관리자 기능)
-- ============================================================================

-- 3-1. 서비스 역할은 모든 지역 관리 가능
CREATE POLICY "Service role can manage all regions" ON regions 
  FOR ALL USING (auth.role() = 'service_role');

-- 3-2. 서비스 역할은 모든 카테고리 관리 가능
CREATE POLICY "Service role can manage all categories" ON categories 
  FOR ALL USING (auth.role() = 'service_role');

-- 3-3. 서비스 역할은 모든 시간대 관리 가능
CREATE POLICY "Service role can manage all time_slots" ON time_slots 
  FOR ALL USING (auth.role() = 'service_role');

-- 3-4. 서비스 역할은 모든 장소 관리 가능
CREATE POLICY "Service role can manage all places" ON places 
  FOR ALL USING (auth.role() = 'service_role');

-- 3-5. 서비스 역할은 모든 장소-시간대 연결 관리 가능
CREATE POLICY "Service role can manage all place_time_slots" ON place_time_slots 
  FOR ALL USING (auth.role() = 'service_role');

-- 3-6. 서비스 역할은 모든 장소 이미지 관리 가능
CREATE POLICY "Service role can manage all place_images" ON place_images 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. 사용자 역할(User Roles) 정책
-- ============================================================================

-- 4-1. 사용자는 자신의 역할 조회 가능
CREATE POLICY "Users can view their own role" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- 4-2. 서비스 역할은 모든 사용자 역할 관리 가능 (시스템 레벨)
CREATE POLICY "Service role can manage all roles" ON user_roles 
  FOR ALL USING (auth.role() = 'service_role');

-- 4-3. 인증된 사용자는 자신의 역할 생성 가능 (트리거용)
CREATE POLICY "Users can create their own role" ON user_roles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. 사용자 프로필(User Profiles) 정책
-- ============================================================================

-- 5-1. 사용자는 자신의 프로필 조회 가능
CREATE POLICY "Users can view their own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

-- 5-2. 사용자는 자신의 프로필 생성 가능
CREATE POLICY "Users can create their own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5-3. 사용자는 자신의 프로필 수정 가능
CREATE POLICY "Users can update their own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5-4. 서비스 역할은 모든 프로필 관리 가능
CREATE POLICY "Service role can manage all profiles" ON user_profiles 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. 사용자 동의(User Agreements) 정책
-- ============================================================================

-- 6-1. 사용자는 자신의 동의 정보 관리 가능
CREATE POLICY "Users can manage their own agreements" ON user_agreements 
  FOR ALL USING (auth.uid() = user_id);

-- 6-2. 서비스 역할은 모든 동의 정보 관리 가능
CREATE POLICY "Service role can manage all agreements" ON user_agreements 
  FOR ALL USING (auth.role() = 'service_role');

-- 6-3. 서비스 역할은 모든 동의 정보 관리 가능 (이미 위에 있음)

-- ============================================================================
-- 7. 사용자 추천 피드백(User Recommendation Feedback) 정책
-- ============================================================================

-- 7-1. 사용자는 자신의 추천 피드백 관리 가능
CREATE POLICY "Users can manage their own recommendation feedback" ON user_recommendation_feedback 
  FOR ALL USING (auth.uid() = user_id);

-- 7-2. 서비스 역할은 모든 추천 피드백 관리 가능 (분석 목적)
CREATE POLICY "Service role can manage all recommendation feedback" ON user_recommendation_feedback 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. 사용자 피드백(User Feedback) 정책
-- ============================================================================

-- 8-1. 사용자는 자신의 피드백 관리 가능
CREATE POLICY "Users can manage their own feedback" ON user_feedback 
  FOR ALL USING (auth.uid() = user_id);

-- 8-2. 서비스 역할은 모든 피드백 관리 가능
CREATE POLICY "Service role can manage all feedback" ON user_feedback 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. 사용자 즐겨찾기(User Favorites) 정책
-- ============================================================================

-- 9-1. 사용자는 자신의 즐겨찾기 관리 가능
CREATE POLICY "Users can manage their own favorites" ON user_favorites 
  FOR ALL USING (auth.uid() = user_id);

-- 9-2. 서비스 역할은 모든 즐겨찾기 관리 가능 (통계 목적)
CREATE POLICY "Service role can manage all favorites" ON user_favorites 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. Storage 정책 (place-images 버킷)
-- ============================================================================

-- 10-1. 인증된 사용자는 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload images" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'place-images' AND 
    auth.uid() IS NOT NULL
  );

-- 10-2. 모든 사용자는 이미지 조회 가능 (public bucket)
CREATE POLICY "Anyone can view images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'place-images');

-- 10-3. 사용자는 자신이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete their own images" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'place-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 10-4. 서비스 역할은 모든 이미지 관리 가능
CREATE POLICY "Service role can manage all images" ON storage.objects 
  FOR ALL USING (
    bucket_id = 'place-images' AND 
    auth.role() = 'service_role'
  );

-- ============================================================================
-- 정책 설정 완료 후 최적화
-- ============================================================================

-- 통계 정보 업데이트 (정책 성능 최적화)
ANALYZE;

-- 설정 완료 알림
COMMENT ON SCHEMA public IS 'Course More Us - Complete schema with RLS policies applied on 2025-01-01'; 