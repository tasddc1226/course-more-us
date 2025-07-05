-- 사용자 즐겨찾기 테이블 생성
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 사용자가 같은 장소를 중복 즐겨찾기할 수 없음
  UNIQUE(user_id, place_id)
);

-- RLS 정책 설정
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 즐겨찾기만 볼 수 있음
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 즐겨찾기만 생성할 수 있음
CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 즐겨찾기만 삭제할 수 있음
CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_place_id ON user_favorites(place_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_favorites_updated_at 
  BEFORE UPDATE ON user_favorites 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();