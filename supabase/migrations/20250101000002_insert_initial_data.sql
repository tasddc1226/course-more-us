-- 🌱 Course More Us - Initial Data Seeding
-- 새로운 스키마에 맞는 초기 데이터 삽입
-- 생성일: 2025년 1월 1일 (스키마 및 RLS 설정 완료 후)

-- ============================================================================
-- 1. 지역 데이터 (검색 최적화 포함)
-- ============================================================================

-- 1-1. 주요 지역 삽입
INSERT INTO regions (name, slug, description, region_type, search_keywords, is_popular, display_order) VALUES
('성수동', 'seongsu', '힙한 카페와 갤러리가 많은 감성적인 지역', 'district', 
 ARRAY['성수', '성수동', '카페거리', '힙스터', '감성카페'], true, 3),
('광명', 'gwangmyeong', '자연과 도시가 조화를 이룬 편안한 지역', 'district',
 ARRAY['광명', '광명시', '자연', '공원'], false, 6),
('강남', 'gangnam', '세련된 맛집과 문화시설이 집중된 지역', 'district',
 ARRAY['강남', '강남구', '강남역', '맛집', '세련된'], true, 1),
('홍대', 'hongdae', '젊음과 활기가 넘치는 문화의 중심가', 'district',
 ARRAY['홍대', '홍익대', '홍대입구', '클럽', '젊음', '문화'], true, 2),
('이태원', 'itaewon', '다국적 문화가 어우러진 글로벌 지역', 'district',
 ARRAY['이태원', '다국적', '글로벌', '외국인'], true, 4),
('명동', 'myeongdong', '쇼핑과 맛집이 풍부한 관광 중심지', 'district',
 ARRAY['명동', '쇼핑', '관광', '명동역'], true, 5);

-- 1-2. 세부 지역 삽입 (하위 지역)
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

-- ============================================================================
-- 2. 카테고리 데이터
-- ============================================================================

INSERT INTO categories (name, slug, icon, description) VALUES
('카페', 'cafe', '☕', '감성적인 분위기의 카페와 디저트 가게'),
('음식점', 'restaurant', '🍽️', '맛있는 식사를 할 수 있는 레스토랑'),
('산책로', 'walking', '🌳', '자연을 느끼며 걸을 수 있는 산책 코스'),
('펍/바', 'pub', '🍺', '편안한 분위기에서 술을 즐길 수 있는 곳'),
('문화시설', 'culture', '🎨', '전시회, 공연 등을 즐길 수 있는 문화공간'),
('쇼핑', 'shopping', '🛍️', '쇼핑을 즐길 수 있는 상점과 백화점'),
('액티비티', 'activity', '🏃‍♀️', '체험하고 활동할 수 있는 재미있는 공간');

-- ============================================================================
-- 3. 시간대 데이터
-- ============================================================================

INSERT INTO time_slots (name, slug, start_time, end_time, description) VALUES
('점심 시간', 'lunch', '12:00', '14:00', '맛있는 점심을 즐기기 좋은 시간'),
('오후 시간', 'afternoon', '14:00', '17:00', '여유로운 산책과 카페 타임'),
('저녁 시간', 'evening', '17:00', '21:00', '로맨틱한 저녁과 야경을 즐기는 시간'),
('밤 시간', 'night', '21:00', '24:00', '조용한 분위기에서 대화를 나누는 시간');

-- ============================================================================
-- 4. 샘플 장소 데이터
-- ============================================================================

-- 4-1. 성수동 장소들
INSERT INTO places (
  name, description, address, latitude, longitude, phone, website, rating, price_range, 
  is_partnership, operating_hours, tags, region_id, category_id, source
) VALUES
(
  '블루보틀 커피 성수점', 
  '미국 캘리포니아 출신의 스페셜티 커피 브랜드. 깔끔하고 모던한 인테리어가 인상적인 카페',
  '서울 성동구 성수이로 88-1',
  37.5447, 127.0557,
  '02-1234-5678',
  'https://bluebottlecoffee.com',
  4.3, 3, true,
  '{"monday": "07:00-20:00", "tuesday": "07:00-20:00", "wednesday": "07:00-20:00", "thursday": "07:00-20:00", "friday": "07:00-20:00", "saturday": "08:00-20:00", "sunday": "08:00-20:00"}',
  ARRAY['커피', '디저트', '모던', '깔끔'],
  (SELECT id FROM regions WHERE slug = 'seongsu'),
  (SELECT id FROM categories WHERE slug = 'cafe'),
  'admin'
),
(
  '언더스탠드 에비뉴',
  '성수동의 대표적인 복합문화공간. 다양한 브랜드 매장과 카페가 함께 있는 곳',
  '서울 성동구 성수일로8길 7',
  37.5458, 127.0553,
  '02-2345-6789',
  'https://understand-avenue.com',
  4.1, 2, false,
  '{"monday": "10:00-22:00", "tuesday": "10:00-22:00", "wednesday": "10:00-22:00", "thursday": "10:00-22:00", "friday": "10:00-22:00", "saturday": "10:00-22:00", "sunday": "10:00-22:00"}',
  ARRAY['복합문화공간', '쇼핑', '트렌디'],
  (SELECT id FROM regions WHERE slug = 'seongsu'),
  (SELECT id FROM categories WHERE slug = 'shopping'),
  'admin'
),
(
  '한강공원 뚝섬유원지',
  '한강을 바라보며 산책할 수 있는 공원. 자전거 대여와 피크닉도 가능',
  '서울 광진구 자양동 한강공원',
  37.5347, 127.0709,
  '02-3456-7890',
  null,
  4.5, 1, false,
  '{"monday": "24시간", "tuesday": "24시간", "wednesday": "24시간", "thursday": "24시간", "friday": "24시간", "saturday": "24시간", "sunday": "24시간"}',
  ARRAY['한강', '산책', '자연', '피크닉'],
  (SELECT id FROM regions WHERE slug = 'seongsu'),
  (SELECT id FROM categories WHERE slug = 'walking'),
  'admin'
);

-- 4-2. 강남 장소들
INSERT INTO places (
  name, description, address, latitude, longitude, phone, rating, price_range, 
  operating_hours, tags, region_id, category_id, source
) VALUES
(
  '가로수길',
  '트렌디한 쇼핑과 맛집이 즐비한 강남의 대표 거리',
  '서울 강남구 신사동 가로수길',
  37.5196, 127.0233,
  '02-1111-2222',
  4.2, 3,
  '{"monday": "10:00-23:00", "tuesday": "10:00-23:00", "wednesday": "10:00-23:00", "thursday": "10:00-23:00", "friday": "10:00-24:00", "saturday": "10:00-24:00", "sunday": "10:00-23:00"}',
  ARRAY['쇼핑', '맛집', '트렌드', '데이트'],
  (SELECT id FROM regions WHERE slug = 'gangnam'),
  (SELECT id FROM categories WHERE slug = 'shopping'),
  'admin'
),
(
  '청담공원',
  '도심 속 조용한 산책을 즐길 수 있는 근린공원',
  '서울 강남구 청담동 118',
  37.5274, 127.0467,
  null,
  4.0, 1,
  '{"monday": "05:00-23:00", "tuesday": "05:00-23:00", "wednesday": "05:00-23:00", "thursday": "05:00-23:00", "friday": "05:00-23:00", "saturday": "05:00-23:00", "sunday": "05:00-23:00"}',
  ARRAY['공원', '산책', '자연', '조용한'],
  (SELECT id FROM regions WHERE slug = 'gangnam'),
  (SELECT id FROM categories WHERE slug = 'walking'),
  'admin'
);

-- ============================================================================
-- 5. 장소-시간대 연결 데이터
-- ============================================================================

INSERT INTO place_time_slots (place_id, time_slot_id, priority) VALUES
-- 블루보틀 커피 (오후 시간대 우선)
((SELECT id FROM places WHERE name = '블루보틀 커피 성수점'), (SELECT id FROM time_slots WHERE slug = 'afternoon'), 1),
((SELECT id FROM places WHERE name = '블루보틀 커피 성수점'), (SELECT id FROM time_slots WHERE slug = 'lunch'), 2),

-- 언더스탠드 에비뉴 (오후, 저녁 시간대)
((SELECT id FROM places WHERE name = '언더스탠드 에비뉴'), (SELECT id FROM time_slots WHERE slug = 'afternoon'), 1),
((SELECT id FROM places WHERE name = '언더스탠드 에비뉴'), (SELECT id FROM time_slots WHERE slug = 'evening'), 1),

-- 한강공원 (모든 시간대 가능, 오후가 가장 좋음)
((SELECT id FROM places WHERE name = '한강공원 뚝섬유원지'), (SELECT id FROM time_slots WHERE slug = 'afternoon'), 1),
((SELECT id FROM places WHERE name = '한강공원 뚝섬유원지'), (SELECT id FROM time_slots WHERE slug = 'evening'), 2),
((SELECT id FROM places WHERE name = '한강공원 뚝섬유원지'), (SELECT id FROM time_slots WHERE slug = 'lunch'), 3),

-- 가로수길 (오후, 저녁 시간대)
((SELECT id FROM places WHERE name = '가로수길'), (SELECT id FROM time_slots WHERE slug = 'afternoon'), 1),
((SELECT id FROM places WHERE name = '가로수길'), (SELECT id FROM time_slots WHERE slug = 'evening'), 1),
((SELECT id FROM places WHERE name = '가로수길'), (SELECT id FROM time_slots WHERE slug = 'night'), 2),

-- 청담공원 (모든 시간대, 오후 우선)
((SELECT id FROM places WHERE name = '청담공원'), (SELECT id FROM time_slots WHERE slug = 'afternoon'), 1),
((SELECT id FROM places WHERE name = '청담공원'), (SELECT id FROM time_slots WHERE slug = 'lunch'), 2),
((SELECT id FROM places WHERE name = '청담공원'), (SELECT id FROM time_slots WHERE slug = 'evening'), 2);

-- ============================================================================
-- 6. 샘플 장소 이미지 데이터
-- ============================================================================

INSERT INTO place_images (place_id, image_url, alt_text, display_order, is_primary) VALUES
-- 블루보틀 커피 이미지
((SELECT id FROM places WHERE name = '블루보틀 커피 성수점'), 
 'https://example.com/bluebottle-exterior.jpg', 
 '블루보틀 커피 성수점 외관', 1, true),
((SELECT id FROM places WHERE name = '블루보틀 커피 성수점'), 
 'https://example.com/bluebottle-interior.jpg', 
 '블루보틀 커피 성수점 내부', 2, false),

-- 언더스탠드 에비뉴 이미지
((SELECT id FROM places WHERE name = '언더스탠드 에비뉴'), 
 'https://example.com/understand-avenue-main.jpg', 
 '언더스탠드 에비뉴 메인 홀', 1, true),

-- 한강공원 이미지
((SELECT id FROM places WHERE name = '한강공원 뚝섬유원지'), 
 'https://example.com/hangang-park-view.jpg', 
 '한강공원 뚝섬유원지 전경', 1, true),

-- 가로수길 이미지
((SELECT id FROM places WHERE name = '가로수길'), 
 'https://example.com/garosu-street.jpg', 
 '가로수길 거리 풍경', 1, true),

-- 청담공원 이미지
((SELECT id FROM places WHERE name = '청담공원'), 
 'https://example.com/cheongdam-park.jpg', 
 '청담공원 산책로', 1, true);

-- ============================================================================
-- 데이터 삽입 완료 후 최적화
-- ============================================================================

-- 통계 정보 업데이트
ANALYZE;

-- 완료 알림
COMMENT ON SCHEMA public IS 'Course More Us - Initial data seeded successfully on 2025-01-01'; 