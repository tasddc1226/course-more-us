-- AI 검색 로그 테이블 생성
CREATE TABLE ai_search_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- 검색 요청 정보
  search_request JSONB NOT NULL, -- { userRequest, regionId, regionName, timeSlotIds, date, interests, budgetRange }
  
  -- 검색 응답 정보
  search_response JSONB, -- AI 응답 전체 (성공 시)
  recommended_places_count INTEGER DEFAULT 0,
  
  -- 검색 결과 메타데이터
  is_successful BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT, -- 실패 시 에러 메시지
  search_duration_ms INTEGER, -- 검색 소요 시간 (밀리초)
  perplexity_citations TEXT[], -- 검색 출처 URL들
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 추천 장소 테이블 생성
CREATE TABLE ai_recommended_places (
  id SERIAL PRIMARY KEY,
  ai_search_log_id INTEGER REFERENCES ai_search_logs(id) ON DELETE CASCADE,
  
  -- AI 추천 장소 기본 정보
  place_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  time_slot VARCHAR(50),
  duration INTEGER, -- 추천 체류 시간 (분)
  
  -- AI 검색 특별 정보
  search_info JSONB, -- { recentReview, trendScore, recommendationReason }
  special_tips TEXT,
  
  -- 기존 장소와의 매칭 정보
  matched_place_id INTEGER REFERENCES places(id), -- 매칭된 기존 장소 (있는 경우)
  matching_confidence NUMERIC(3,2), -- 매칭 신뢰도 (0.0-1.0)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_ai_search_logs_user_id ON ai_search_logs(user_id);
CREATE INDEX idx_ai_search_logs_created_at ON ai_search_logs(created_at);
CREATE INDEX idx_ai_search_logs_is_successful ON ai_search_logs(is_successful);
CREATE INDEX idx_ai_recommended_places_log_id ON ai_recommended_places(ai_search_log_id);
CREATE INDEX idx_ai_recommended_places_matched_place ON ai_recommended_places(matched_place_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE ai_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommended_places ENABLE ROW LEVEL SECURITY;

-- ai_search_logs 정책
CREATE POLICY "Users can view their own AI search logs" ON ai_search_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI search logs" ON ai_search_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI search logs" ON ai_search_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- ai_recommended_places 정책
CREATE POLICY "Users can view AI recommended places from their searches" ON ai_recommended_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_search_logs 
      WHERE ai_search_logs.id = ai_recommended_places.ai_search_log_id 
      AND ai_search_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI recommended places for their searches" ON ai_recommended_places
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_search_logs 
      WHERE ai_search_logs.id = ai_recommended_places.ai_search_log_id 
      AND ai_search_logs.user_id = auth.uid()
    )
  );

-- 관리자는 모든 AI 검색 로그에 접근 가능
CREATE POLICY "Admin full access to ai_search_logs" ON ai_search_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admin full access to ai_recommended_places" ON ai_recommended_places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_ai_search_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_search_logs_updated_at
  BEFORE UPDATE ON ai_search_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_search_logs_updated_at(); 