-- 코스모스 데이트 코스 추천 서비스 - 완전한 초기 스키마
-- 생성일: 2025년 6월 15일
-- 모든 테이블, RLS 정책, 트리거, 함수를 포함한 통합 마이그레이션

-- =====================================================
-- 1. 핵심 테이블 생성
-- =====================================================

-- 지역 테이블
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 카테고리 테이블
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(10), -- 이모지 아이콘
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시간대 테이블
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

-- 장소 테이블 (메인)
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  price_range INTEGER DEFAULT 1 CHECK (price_range >= 1 AND price_range <= 4), -- 1: 저렴, 4: 비싼
  is_partnership BOOLEAN DEFAULT FALSE, -- 제휴 여부
  operating_hours JSONB, -- 영업시간 JSON 형태로 저장
  tags TEXT[], -- 태그 배열
  region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 장소-시간대 연결 테이블 (M:N)
CREATE TABLE place_time_slots (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1, -- 해당 시간대에서의 우선순위
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id, time_slot_id)
);

-- 장소 이미지 테이블
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

-- 사용자 역할 테이블
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 2. 인덱스 생성
-- =====================================================

CREATE INDEX idx_places_region_id ON places(region_id);
CREATE INDEX idx_places_category_id ON places(category_id);
CREATE INDEX idx_places_is_active ON places(is_active);
CREATE INDEX idx_places_is_partnership ON places(is_partnership);
CREATE INDEX idx_places_rating ON places(rating);
CREATE INDEX idx_place_time_slots_place_id ON place_time_slots(place_id);
CREATE INDEX idx_place_time_slots_time_slot_id ON place_time_slots(time_slot_id);
CREATE INDEX idx_place_images_place_id ON place_images(place_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- =====================================================
-- 3. 트리거 함수 및 트리거 생성
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_regions_updated_at 
BEFORE UPDATE ON regions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at 
BEFORE UPDATE ON time_slots 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at 
BEFORE UPDATE ON places 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_images_updated_at 
BEFORE UPDATE ON place_images 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
BEFORE UPDATE ON user_roles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. 새로운 사용자 자동 역할 부여 시스템
-- =====================================================

-- 새로운 사용자 자동 역할 부여 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로운 사용자가 생성되면 user_roles 테이블에 'user' 역할로 추가
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 새 사용자가 추가될 때 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 5. Row Level Security (RLS) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 권한: 모든 사용자 (인증 여부 무관)
CREATE POLICY "Anyone can read regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read time_slots" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can read active places" ON places FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read place_time_slots" ON place_time_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can read place_images" ON place_images FOR SELECT USING (true);

-- 관리자 권한: 인증된 사용자만 수정 가능
CREATE POLICY "Authenticated users can manage regions" ON regions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage time_slots" ON time_slots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage places" ON places FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage place_time_slots" ON place_time_slots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage place_images" ON place_images FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. 사용자 역할 관리 RLS 정책
-- =====================================================

-- 사용자는 자신의 역할만 조회 가능
CREATE POLICY "Users can read their own role" ON user_roles 
FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 사용자 역할 조회 가능
CREATE POLICY "Admins can read all user roles" ON user_roles 
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- 관리자는 사용자 역할 생성 가능
CREATE POLICY "Admins can insert user roles" ON user_roles 
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- 관리자는 사용자 역할 수정 가능
CREATE POLICY "Admins can update user roles" ON user_roles 
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- 관리자는 사용자 역할 삭제 가능
CREATE POLICY "Admins can delete user roles" ON user_roles 
FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- 시스템 트리거는 모든 작업 허용 (SECURITY DEFINER 함수용)
CREATE POLICY "System can manage user roles" ON user_roles 
FOR ALL USING (current_setting('role') = 'service_role');

-- =====================================================
-- 7. 기존 사용자들에게 기본 역할 부여
-- =====================================================

-- 기존 사용자 중 user_roles가 없는 사용자들에게 기본 'user' 역할 부여
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 스키마 생성 완료
-- ===================================================== 