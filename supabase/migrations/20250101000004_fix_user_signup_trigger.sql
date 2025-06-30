-- 🔧 Fix User Signup Trigger Issues
-- 회원가입 시 user_roles와 user_profiles 자동 생성 문제 해결
-- 트리거 함수 권한 및 RLS 정책 수정

-- ============================================================================
-- 1. 기존 트리거 삭제 및 재생성
-- ============================================================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ============================================================================
-- 2. 강화된 사용자 생성 함수 재작성
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- 함수 소유자 권한으로 실행
SET search_path = public
AS $$
DECLARE
  nickname_value text;
BEGIN
  -- 디버그용 로그
  RAISE LOG 'Creating user profile and role for user: %', NEW.id;
  
  -- 1. user_roles 생성 (RLS 우회를 위해 직접 INSERT)
  BEGIN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'user');
    
    RAISE LOG 'Successfully created user_role for user: %', NEW.id;
  EXCEPTION 
    WHEN OTHERS THEN 
      RAISE LOG 'Error creating user role for %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- 에러가 있어도 계속 진행
  END;
  
  -- 2. user_profiles 생성
  BEGIN
    -- nickname 생성 로직
    nickname_value := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'nickname',
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- 빈 문자열 처리
    IF nickname_value IS NULL OR LENGTH(TRIM(nickname_value)) = 0 THEN
      nickname_value := 'user_' || substring(NEW.id::text from 1 for 8);
    END IF;
    
    -- 중복 nickname 방지
    WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE nickname = nickname_value) LOOP
      nickname_value := nickname_value || '_' || substring(NEW.id::text from 1 for 8);
    END LOOP;
    
    INSERT INTO public.user_profiles (id, nickname, avatar_url)
    VALUES (
      NEW.id,
      nickname_value,
      NEW.raw_user_meta_data->>'avatar_url'
    );
    
    RAISE LOG 'Successfully created user_profile for user: % with nickname: %', NEW.id, nickname_value;
    
  EXCEPTION 
    WHEN OTHERS THEN 
      RAISE LOG 'Error creating user profile for %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. 트리거 재생성
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 4. RLS 정책 보완 (트리거가 작동할 수 있도록)
-- ============================================================================

-- user_roles 테이블에 트리거용 정책 추가
DROP POLICY IF EXISTS "Allow trigger to create user roles" ON user_roles;
CREATE POLICY "Allow trigger to create user roles" ON user_roles 
  FOR INSERT WITH CHECK (true);  -- 트리거 실행시에는 모든 INSERT 허용

-- user_profiles 테이블에 트리거용 정책 추가  
DROP POLICY IF EXISTS "Allow trigger to create user profiles" ON user_profiles;
CREATE POLICY "Allow trigger to create user profiles" ON user_profiles 
  FOR INSERT WITH CHECK (true);  -- 트리거 실행시에는 모든 INSERT 허용

-- ============================================================================
-- 5. 기존 사용자들에 대한 데이터 보완
-- ============================================================================

-- 기존 auth.users에 있지만 user_roles가 없는 사용자들에 대해 역할 생성
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id,
  'user'
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
  AND au.email IS NOT NULL  -- 유효한 사용자만
ON CONFLICT (user_id) DO NOTHING;

-- 기존 auth.users에 있지만 user_profiles가 없는 사용자들에 대해 프로필 생성
INSERT INTO user_profiles (id, nickname, avatar_url)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'nickname',
    SPLIT_PART(au.email, '@', 1),
    'user_' || substring(au.id::text from 1 for 8)
  ) as nickname,
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
  AND au.email IS NOT NULL  -- 유효한 사용자만
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. 함수 권한 설정
-- ============================================================================

-- 함수에 적절한 권한 부여
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- ============================================================================
-- 완료 및 최적화
-- ============================================================================

-- 통계 정보 업데이트
ANALYZE user_roles;
ANALYZE user_profiles;

-- 완료 알림
COMMENT ON FUNCTION handle_new_user() IS 'Enhanced user signup trigger - creates user_roles and user_profiles automatically'; 