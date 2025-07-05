-- =================================================================
-- 코스모스 서비스 통합 스키마 (v_final)
-- 생성일: 2024년 07월 28일
-- 모든 테이블, 트리거, 함수, RLS 정책을 포함한 단일 마이그레이션 파일
-- =================================================================

-- 1. 기존 객체들 삭제 (스크립트 안정성 확보)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_agreements CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
-- 다른 기본 테이블들도 안전하게 삭제 (필요 시)
DROP TABLE IF EXISTS public.place_images CASCADE;
DROP TABLE IF EXISTS public.place_time_slots CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
DROP TABLE IF EXISTS public.time_slots CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;


-- 2. 기본 데이터 테이블 생성
CREATE TABLE public.regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(10),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.time_slots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  rating DECIMAL(2, 1) DEFAULT 0.0,
  price_range INTEGER DEFAULT 1,
  is_partnership BOOLEAN DEFAULT FALSE,
  operating_hours JSONB,
  tags TEXT[],
  region_id INTEGER REFERENCES public.regions(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.place_time_slots (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES public.places(id) ON DELETE CASCADE,
  time_slot_id INTEGER REFERENCES public.time_slots(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id, time_slot_id)
);
CREATE TABLE public.place_images (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES public.places(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. 사용자 관련 테이블 생성
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.user_agreements (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  terms_agreed BOOLEAN NOT NULL DEFAULT false,
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,
  marketing_agreed BOOLEAN NOT NULL DEFAULT false,
  terms_agreed_at TIMESTAMPTZ,
  privacy_agreed_at TIMESTAMPTZ,
  marketing_agreed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX idx_places_region_id ON places(region_id);
CREATE INDEX idx_places_category_id ON places(category_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);


-- 5. 트리거 함수 및 연결
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. Row Level Security (RLS) 활성화 및 정책 설정
-- 기본 데이터 테이블 RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 장소 정보를 읽을 수 있습니다." ON public.places FOR SELECT USING (true);
CREATE POLICY "인증된 사용자는 장소를 관리할 수 있습니다." ON public.places FOR ALL USING (auth.role() = 'authenticated');

-- 사용자 역할 테이블 RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "사용자는 자신의 역할 정보를 볼 수 있습니다." ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "서비스 관리자는 모든 역할을 관리할 수 있습니다." ON public.user_roles FOR ALL USING (auth.role() = 'service_role');

-- 약관 동의 테이블 RLS
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "사용자는 자신의 동의 정보를 관리할 수 있습니다." ON public.user_agreements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "서비스 관리자는 모든 동의 정보를 관리할 수 있습니다." ON public.user_agreements FOR ALL USING (auth.role() = 'service_role'); 