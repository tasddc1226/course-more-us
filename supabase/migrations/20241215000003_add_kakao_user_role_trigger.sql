-- 카카오 로그인 사용자에게 자동으로 user 역할을 부여하는 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로운 사용자가 생성되면 user_roles 테이블에 'user' 역할로 추가
  -- 이미 존재하는 경우 무시 (ON CONFLICT DO NOTHING)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- auth.users 테이블에 새 사용자가 추가될 때 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 기존 사용자 중 user_roles가 없는 사용자들에게 기본 'user' 역할 부여
-- ON CONFLICT를 사용하여 중복 삽입 방지
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- 트리거 함수에 대한 설명 추가
COMMENT ON FUNCTION handle_new_user() IS '새로운 사용자(이메일/카카오 로그인)에게 자동으로 user 역할을 부여하는 함수'; 