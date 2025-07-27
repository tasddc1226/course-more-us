-- 코스 편집 이력 테이블 (generated_courses 테이블 생성 후 적용)
-- 이 마이그레이션은 generated_courses 테이블이 존재할 때만 실행

-- generated_courses 테이블 존재 여부 확인
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'generated_courses'
  ) THEN
    -- 코스 편집 이력 테이블 생성
    CREATE TABLE IF NOT EXISTS course_edit_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      original_course JSONB NOT NULL,
      edited_course JSONB NOT NULL,
      changes JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 인덱스 추가
    CREATE INDEX IF NOT EXISTS idx_course_edit_history_course_id ON course_edit_history(course_id);
    CREATE INDEX IF NOT EXISTS idx_course_edit_history_user_id ON course_edit_history(user_id);

    -- RLS 정책 설정
    ALTER TABLE course_edit_history ENABLE ROW LEVEL SECURITY;

    -- RLS 정책 생성
    DROP POLICY IF EXISTS "사용자는 자신의 편집 이력만 조회 가능" ON course_edit_history;
    CREATE POLICY "사용자는 자신의 편집 이력만 조회 가능" ON course_edit_history
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "사용자는 자신의 편집 이력 생성 가능" ON course_edit_history;
    CREATE POLICY "사용자는 자신의 편집 이력 생성 가능" ON course_edit_history
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'course_edit_history 테이블이 성공적으로 생성되었습니다.';
  ELSE
    RAISE NOTICE 'generated_courses 테이블이 존재하지 않아 course_edit_history 테이블 생성을 건너뜁니다.';
  END IF;
END $$;