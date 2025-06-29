-- 사용자 추천 피드백 테이블 생성
CREATE TABLE user_recommendation_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'visited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 사용자가 같은 장소에 대해 같은 타입의 피드백은 한 번만
  UNIQUE(user_id, place_id, feedback_type)
);

-- RLS 정책 설정
ALTER TABLE user_recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 피드백만 볼 수 있음
CREATE POLICY "Users can view their own feedback" ON user_recommendation_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 피드백만 생성할 수 있음
CREATE POLICY "Users can create their own feedback" ON user_recommendation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 피드백만 수정할 수 있음
CREATE POLICY "Users can update their own feedback" ON user_recommendation_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 피드백만 삭제할 수 있음
CREATE POLICY "Users can delete their own feedback" ON user_recommendation_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_user_recommendation_feedback_user_id ON user_recommendation_feedback(user_id);
CREATE INDEX idx_user_recommendation_feedback_place_id ON user_recommendation_feedback(place_id);
CREATE INDEX idx_user_recommendation_feedback_type ON user_recommendation_feedback(feedback_type);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_recommendation_feedback_updated_at 
  BEFORE UPDATE ON user_recommendation_feedback 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
