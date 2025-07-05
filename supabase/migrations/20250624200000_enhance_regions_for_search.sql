-- 지역 테이블 검색 최적화를 위한 확장
-- 생성일: 2025년 2월 1일

-- 1. 지역 테이블에 검색 최적화 필드 추가
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS parent_region_id INTEGER REFERENCES regions(id),
ADD COLUMN IF NOT EXISTS region_type VARCHAR(20) DEFAULT 'district' CHECK (region_type IN ('city', 'district', 'neighborhood', 'landmark')),
ADD COLUMN IF NOT EXISTS search_keywords TEXT[], -- 검색 키워드 배열
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE, -- 인기 지역 여부
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0, -- 표시 순서
ADD COLUMN IF NOT EXISTS coordinates POINT; -- 지역 중심 좌표

-- 2. 검색 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_regions_parent_id ON regions(parent_region_id);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(region_type);
CREATE INDEX IF NOT EXISTS idx_regions_popular ON regions(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_regions_search_keywords ON regions USING GIN (search_keywords);
CREATE INDEX IF NOT EXISTS idx_regions_display_order ON regions(display_order);

-- 3. 기존 지역 데이터 업데이트
UPDATE regions SET 
  region_type = 'district',
  is_popular = CASE 
    WHEN slug IN ('seongsu', 'gangnam', 'hongdae', 'itaewon', 'myeongdong') THEN true 
    ELSE false 
  END,
  display_order = CASE slug
    WHEN 'gangnam' THEN 1
    WHEN 'hongdae' THEN 2
    WHEN 'seongsu' THEN 3
    WHEN 'itaewon' THEN 4
    WHEN 'myeongdong' THEN 5
    ELSE 10
  END,
  search_keywords = CASE slug
    WHEN 'seongsu' THEN ARRAY['성수', '성수동', '카페거리', '힙스터', '감성카페']
    WHEN 'gwangmyeong' THEN ARRAY['광명', '광명시', '자연', '공원']
    WHEN 'gangnam' THEN ARRAY['강남', '강남구', '강남역', '맛집', '세련된']
    WHEN 'hongdae' THEN ARRAY['홍대', '홍익대', '홍대입구', '클럽', '젊음', '문화']
    WHEN 'itaewon' THEN ARRAY['이태원', '다국적', '글로벌', '외국인']
    WHEN 'myeongdong' THEN ARRAY['명동', '쇼핑', '관광', '명동역']
    ELSE ARRAY[name]
  END;

-- 4. 새로운 세분화된 지역 추가 (기존 지역의 하위 지역)
INSERT INTO regions (name, slug, description, parent_region_id, region_type, search_keywords, is_popular, display_order) VALUES
-- 강남 하위 지역
('강남역', 'gangnam-station', '강남의 중심가, 쇼핑과 맛집의 메카', 
 (SELECT id FROM regions WHERE slug = 'gangnam'), 'landmark', 
 ARRAY['강남역', '강남역맛집', '강남쇼핑'], true, 1),
('논현동', 'nonhyeon', '고급 음식점과 카페가 많은 세련된 지역',
 (SELECT id FROM regions WHERE slug = 'gangnam'), 'neighborhood',
 ARRAY['논현동', '논현', '고급맛집'], false, 2),

-- 홍대 하위 지역  
('홍대입구', 'hongik-entrance', '젊음과 활기가 넘치는 문화의 중심',
 (SELECT id FROM regions WHERE slug = 'hongdae'), 'landmark',
 ARRAY['홍대입구', '홍대입구역', '클럽거리'], true, 1),
('상수동', 'sangsu', '조용한 카페와 소규모 문화공간이 있는 곳',
 (SELECT id FROM regions WHERE slug = 'hongdae'), 'neighborhood',
 ARRAY['상수동', '상수', '조용한카페'], false, 2),

-- 성수동 하위 지역
('성수카페거리', 'seongsu-cafe-street', '트렌디한 카페와 베이커리 집중 지역',
 (SELECT id FROM regions WHERE slug = 'seongsu'), 'landmark', 
 ARRAY['성수카페거리', '카페거리', '성수카페'], true, 1),
('성수공업지역', 'seongsu-industrial', '힙한 갤러리와 복합문화공간이 있는 곳',
 (SELECT id FROM regions WHERE slug = 'seongsu'), 'neighborhood',
 ARRAY['성수공업지역', '갤러리', '복합문화공간'], false, 2);

-- 5. 지역 검색 함수 생성
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

-- 6. 통계 정보 업데이트
ANALYZE regions; 