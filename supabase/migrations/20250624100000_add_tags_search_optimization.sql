-- 태그 검색 성능 최적화를 위한 인덱스 추가

-- pg_trgm 확장 활성화 (부분 문자열 검색을 위해)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. 태그 배열 검색을 위한 GIN 인덱스 (기본 연산자 사용)
CREATE INDEX IF NOT EXISTS idx_places_tags_gin 
ON places USING GIN (tags);

-- 2. Full Text Search 성능 향상을 위한 인덱스 (언어 무관)
CREATE INDEX IF NOT EXISTS idx_places_fts 
ON places USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

-- 3. 이름과 설명 필드의 부분 문자열 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_places_name_trgm 
ON places USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_places_description_trgm 
ON places USING GIN (description gin_trgm_ops);

-- 4. 활성 장소 필터링을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_places_active_tags 
ON places (is_active) WHERE is_active = true;

-- 5. 지역별 태그 검색을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_places_region_tags 
ON places (region_id, is_active) INCLUDE (tags) WHERE is_active = true;

-- 통계 정보 업데이트
ANALYZE places; 