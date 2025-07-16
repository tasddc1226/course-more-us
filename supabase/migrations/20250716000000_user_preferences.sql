-- 사용자 선호도 테이블
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  category_preferences JSONB DEFAULT '{}',
  price_range_min INTEGER DEFAULT 0,
  price_range_max INTEGER DEFAULT 100000,
  preferred_themes TEXT[] DEFAULT '{}',
  accessibility_needs JSONB DEFAULT '{}',
  preferred_time_slots TEXT[] DEFAULT '{}',
  group_size_preference INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 선호도 학습 이벤트 테이블
CREATE TABLE preference_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('like', 'dislike', 'visit', 'view', 'skip', 'save', 'share')),
  target_type TEXT NOT NULL CHECK (target_type IN ('place', 'course', 'category')),
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_preference_learning_events_user_id ON preference_learning_events(user_id);
CREATE INDEX idx_preference_learning_events_created_at ON preference_learning_events(created_at DESC);
CREATE INDEX idx_preference_learning_events_composite ON preference_learning_events(user_id, event_type, target_type);

-- RLS 정책 설정
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE preference_learning_events ENABLE ROW LEVEL SECURITY;

-- user_preferences RLS 정책
CREATE POLICY "사용자는 자신의 선호도만 조회 가능" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 선호도 생성 가능" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 선호도 수정 가능" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 선호도 삭제 가능" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- preference_learning_events RLS 정책
CREATE POLICY "사용자는 자신의 이벤트만 조회 가능" ON preference_learning_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 이벤트 생성 가능" ON preference_learning_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_preferences 업데이트 트리거
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();