-- 사용자 프로필 테이블 생성
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(nickname)
);

-- 인덱스 생성
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);

-- RLS 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 읽기/수정 가능
CREATE POLICY "Users can read their own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 관리자는 모든 프로필 읽기 가능
CREATE POLICY "Admins can read all profiles" ON user_profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- updated_at 트리거 추가
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기존 사용자들을 위한 초기 프로필 생성 함수
CREATE OR REPLACE FUNCTION create_profile_for_existing_users()
RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (id, nickname, avatar_url)
  SELECT 
    id,
    COALESCE(
      raw_user_meta_data->>'full_name',
      SPLIT_PART(email, '@', 1)
    ) as nickname,
    raw_user_meta_data->>'avatar_url' as avatar_url
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM user_profiles);
END;
$$ LANGUAGE plpgsql;

-- 기존 사용자들에 대한 프로필 생성 실행
SELECT create_profile_for_existing_users();

-- 새로운 사용자 가입 시 자동으로 프로필 생성하는 트리거 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, nickname, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 가입 시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 