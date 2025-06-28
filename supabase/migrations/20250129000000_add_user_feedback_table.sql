-- 유저 피드백 테이블 생성
CREATE TABLE user_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (feedback_type IN ('general', 'bug_report', 'feature_request', 'improvement')),
  title VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스 추가
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 피드백만 조회 가능
CREATE POLICY "Users can view their own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 피드백을 생성 가능
CREATE POLICY "Users can create their own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 피드백을 수정 가능 (status가 pending인 경우만)
CREATE POLICY "Users can update their own pending feedback" ON user_feedback
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_feedback_updated_at 
  BEFORE UPDATE ON user_feedback 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();