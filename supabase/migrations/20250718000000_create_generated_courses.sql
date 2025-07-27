-- 생성된 코스 테이블 추가
-- DAY13 개발에서 필요한 코스 편집 기능을 위한 테이블

-- 생성된 코스 테이블
CREATE TABLE IF NOT EXISTS generated_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'custom',
  description TEXT,
  region_id INTEGER REFERENCES regions(id),
  total_duration INTEGER DEFAULT 0, -- 분 단위
  total_distance INTEGER DEFAULT 0, -- 미터 단위
  estimated_cost_min INTEGER DEFAULT 0,
  estimated_cost_max INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  weather_suitability TEXT DEFAULT 'mixed' CHECK (weather_suitability IN ('indoor', 'outdoor', 'mixed')),
  course_data JSONB NOT NULL, -- DateCourse 전체 데이터 저장
  ai_generated BOOLEAN DEFAULT false, -- AI로 생성된 코스인지 여부
  is_shared BOOLEAN DEFAULT false, -- 공유 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코스-장소 연결 테이블
CREATE TABLE IF NOT EXISTS course_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  time_slot_id INTEGER REFERENCES time_slots(id),
  suggested_duration INTEGER DEFAULT 60, -- 분 단위
  visit_order INTEGER NOT NULL,
  distance_from_previous INTEGER DEFAULT 0, -- 미터 단위
  travel_time_from_previous INTEGER DEFAULT 0, -- 분 단위
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_generated_courses_user_id ON generated_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_courses_region_id ON generated_courses(region_id);
CREATE INDEX IF NOT EXISTS idx_generated_courses_theme ON generated_courses(theme);
CREATE INDEX IF NOT EXISTS idx_generated_courses_created_at ON generated_courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_places_course_id ON course_places(course_id);
CREATE INDEX IF NOT EXISTS idx_course_places_place_id ON course_places(place_id);
CREATE INDEX IF NOT EXISTS idx_course_places_visit_order ON course_places(course_id, visit_order);

-- RLS 정책 설정
ALTER TABLE generated_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_places ENABLE ROW LEVEL SECURITY;

-- generated_courses RLS 정책
CREATE POLICY "사용자는 자신의 코스만 조회 가능" ON generated_courses
  FOR SELECT USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "사용자는 자신의 코스 생성 가능" ON generated_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 코스 수정 가능" ON generated_courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 코스 삭제 가능" ON generated_courses
  FOR DELETE USING (auth.uid() = user_id);

-- course_places RLS 정책  
CREATE POLICY "코스 소유자는 코스 장소 조회 가능" ON course_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generated_courses 
      WHERE id = course_places.course_id 
      AND (user_id = auth.uid() OR is_shared = true)
    )
  );

CREATE POLICY "코스 소유자는 코스 장소 생성 가능" ON course_places
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM generated_courses 
      WHERE id = course_places.course_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "코스 소유자는 코스 장소 수정 가능" ON course_places
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM generated_courses 
      WHERE id = course_places.course_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "코스 소유자는 코스 장소 삭제 가능" ON course_places
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM generated_courses 
      WHERE id = course_places.course_id 
      AND user_id = auth.uid()
    )
  );

-- 업데이트 트리거 함수 (이미 존재하는 경우 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  return NEW;
END;
$$ LANGUAGE plpgsql;

-- generated_courses 업데이트 트리거
CREATE TRIGGER update_generated_courses_updated_at 
  BEFORE UPDATE ON generated_courses 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();