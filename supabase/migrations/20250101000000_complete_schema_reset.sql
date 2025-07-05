-- 🚀 Course More Us - Complete Schema Reset and Setup
-- 모든 기존 테이블과 데이터를 완전히 리셋하고 최신 스키마로 재구성
-- 생성일: 2025년 1월 1일

-- ============================================================================
-- 1. 기존 테이블 및 관련 객체 완전 삭제
-- ============================================================================

-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Anyone can view active places" ON places;
DROP POLICY IF EXISTS "Users can insert their own places" ON places;
DROP POLICY IF EXISTS "Service role can manage all agreements" ON user_agreements;
DROP POLICY IF EXISTS "Users can manage their own agreements" ON user_agreements;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own recommendation feedback" ON user_recommendation_feedback;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own places" ON places;

-- 기존 함수들 삭제
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS search_regions(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Storage 정책들 삭제
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 기존 테이블들 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS user_recommendation_feedback CASCADE;
DROP TABLE IF EXISTS user_feedback CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS user_agreements CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS place_images CASCADE;
DROP TABLE IF EXISTS place_time_slots CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

-- Storage 객체 및 버킷 삭제
DELETE FROM storage.objects WHERE bucket_id = 'place-images';
DELETE FROM storage.buckets WHERE id = 'place-images';

-- ============================================================================
-- 2. 새로운 스키마 생성
-- ============================================================================

-- 공통 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 2-1. 지역 테이블 (검색 최적화 포함)
-- ============================================================================
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_region_id INTEGER REFERENCES regions(id),
  region_type VARCHAR(20) DEFAULT 'district' CHECK (region_type IN ('city', 'district', 'neighborhood', 'landmark')),
  search_keywords TEXT[], -- 검색 키워드 배열
  is_popular BOOLEAN DEFAULT FALSE, -- 인기 지역 여부
  display_order INTEGER DEFAULT 0, -- 표시 순서
  coordinates POINT, -- 지역 중심 좌표
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-2. 카테고리 테이블
-- ============================================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(10), -- 이모지 아이콘
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-3. 시간대 테이블
-- ============================================================================
CREATE TABLE time_slots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-4. 장소 테이블 (사용자 등록 지원)
-- ============================================================================
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  website VARCHAR(255),
  rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  price_range INTEGER DEFAULT 1 CHECK (price_range >= 1 AND price_range <= 4), -- 1: 저렴, 4: 비싼
  is_partnership BOOLEAN DEFAULT FALSE, -- 제휴 여부
  operating_hours JSONB, -- 영업시간 JSON 형태로 저장
  tags TEXT[], -- 태그 배열
  region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 등록 사용자
  source VARCHAR(10) NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'user')), -- 등록 출처
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-5. 장소-시간대 연결 테이블
-- ============================================================================
CREATE TABLE place_time_slots (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1, -- 해당 시간대에서의 우선순위
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id, time_slot_id)
);

-- ============================================================================
-- 2-6. 장소 이미지 테이블
-- ============================================================================
CREATE TABLE place_images (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-7. 사용자 역할 테이블
-- ============================================================================
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 2-8. 사용자 프로필 테이블
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-9. 사용자 동의 테이블
-- ============================================================================
CREATE TABLE user_agreements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  terms_agreed_at TIMESTAMP WITH TIME ZONE,
  privacy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_agreed_at TIMESTAMP WITH TIME ZONE,
  marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_agreed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 2-10. 사용자 추천 피드백 테이블
-- ============================================================================
CREATE TABLE user_recommendation_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id, feedback_type)
);

-- ============================================================================
-- 2-11. 사용자 피드백 테이블
-- ============================================================================
CREATE TABLE user_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (feedback_type IN ('bug', 'feature', 'general', 'improvement')),
  title VARCHAR(200),
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2-12. 사용자 즐겨찾기 테이블
-- ============================================================================
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- ============================================================================
-- 3. 인덱스 생성
-- ============================================================================

-- regions 인덱스
CREATE INDEX idx_regions_parent_id ON regions(parent_region_id);
CREATE INDEX idx_regions_type ON regions(region_type);
CREATE INDEX idx_regions_popular ON regions(is_popular) WHERE is_popular = true;
CREATE INDEX idx_regions_search_keywords ON regions USING GIN (search_keywords);
CREATE INDEX idx_regions_display_order ON regions(display_order);

-- places 인덱스
CREATE INDEX idx_places_region_id ON places(region_id);
CREATE INDEX idx_places_category_id ON places(category_id);
CREATE INDEX idx_places_user_id ON places(user_id);
CREATE INDEX idx_places_source ON places(source);
CREATE INDEX idx_places_is_active ON places(is_active);
CREATE INDEX idx_places_is_partnership ON places(is_partnership);
CREATE INDEX idx_places_rating ON places(rating);
CREATE INDEX idx_places_tags ON places USING GIN (tags);

-- 연결 테이블 인덱스
CREATE INDEX idx_place_time_slots_place_id ON place_time_slots(place_id);
CREATE INDEX idx_place_time_slots_time_slot_id ON place_time_slots(time_slot_id);
CREATE INDEX idx_place_images_place_id ON place_images(place_id);

-- 사용자 관련 인덱스
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX idx_user_recommendation_feedback_user_id ON user_recommendation_feedback(user_id);
CREATE INDEX idx_user_recommendation_feedback_place_id ON user_recommendation_feedback(place_id);
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_place_id ON user_favorites(place_id);

-- ============================================================================
-- 4. 트리거 설정
-- ============================================================================

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_place_images_updated_at BEFORE UPDATE ON place_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_agreements_updated_at BEFORE UPDATE ON user_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_recommendation_feedback_updated_at BEFORE UPDATE ON user_recommendation_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_feedback_updated_at BEFORE UPDATE ON user_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_favorites_updated_at BEFORE UPDATE ON user_favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Storage 설정
-- ============================================================================

-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('place-images', 'place-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. 사용자 자동 생성 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nickname_value text;
BEGIN
  -- 1. user_roles 생성
  BEGIN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
  EXCEPTION 
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating user role for %: %', NEW.id, SQLERRM;
  END;
  
  -- 2. user_profiles 생성
  BEGIN
    -- nickname 생성
    nickname_value := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- 중복 nickname 방지
    IF EXISTS (SELECT 1 FROM user_profiles WHERE nickname = nickname_value) THEN
      nickname_value := nickname_value || '_' || substring(NEW.id::text from 1 for 8);
    END IF;
    
    INSERT INTO user_profiles (id, nickname, avatar_url)
    VALUES (
      NEW.id,
      nickname_value,
      NEW.raw_user_meta_data->>'avatar_url'
    );
    
  EXCEPTION 
    WHEN OTHERS THEN 
      RAISE NOTICE 'Error creating user profile for %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- 새로운 사용자 가입시 자동으로 프로필 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 7. 지역 검색 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION search_regions(search_term TEXT)
RETURNS TABLE (
  id INTEGER,
  name VARCHAR(50),
  slug VARCHAR(50),
  description TEXT,
  region_type VARCHAR(20),
  parent_name VARCHAR(50),
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.description,
    r.region_type,
    p.name as parent_name,
    CASE 
      WHEN r.name ILIKE search_term || '%' THEN 100  -- 이름으로 시작
      WHEN r.name ILIKE '%' || search_term || '%' THEN 90  -- 이름에 포함
      WHEN search_term = ANY(r.search_keywords) THEN 80  -- 키워드 정확 매치
      WHEN EXISTS (SELECT 1 FROM unnest(r.search_keywords) k WHERE k ILIKE '%' || search_term || '%') THEN 70  -- 키워드 부분 매치
      ELSE 50
    END as match_score
  FROM regions r
  LEFT JOIN regions p ON r.parent_region_id = p.id
  WHERE 
    r.name ILIKE '%' || search_term || '%' 
    OR search_term = ANY(r.search_keywords)
    OR EXISTS (SELECT 1 FROM unnest(r.search_keywords) k WHERE k ILIKE '%' || search_term || '%')
  ORDER BY match_score DESC, r.is_popular DESC, r.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. RLS (Row Level Security) 활성화
-- ============================================================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 스키마 완료 후 통계 정보 업데이트
ANALYZE; 