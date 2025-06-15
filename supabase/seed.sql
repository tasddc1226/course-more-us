-- 코스모스 초기 데이터 시드

-- 지역 데이터
INSERT INTO regions (name, slug, description) VALUES
('성수동', 'seongsu', '힙한 카페와 갤러리가 많은 감성적인 지역'),
('광명', 'gwangmyeong', '자연과 도시가 조화를 이룬 편안한 지역'),
('강남', 'gangnam', '세련된 맛집과 문화시설이 집중된 지역'),
('홍대', 'hongdae', '젊음과 활기가 넘치는 문화의 중심가'),
('이태원', 'itaewon', '다국적 문화가 어우러진 글로벌 지역'),
('명동', 'myeongdong', '쇼핑과 맛집이 풍부한 관광 중심지');

-- 카테고리 데이터
INSERT INTO categories (name, slug, icon, description) VALUES
('카페', 'cafe', '☕', '감성적인 분위기의 카페와 디저트 가게'),
('음식점', 'restaurant', '🍽️', '맛있는 식사를 할 수 있는 레스토랑'),
('산책로', 'walking', '🌳', '자연을 느끼며 걸을 수 있는 산책 코스'),
('펍/바', 'pub', '🍺', '편안한 분위기에서 술을 즐길 수 있는 곳'),
('문화시설', 'culture', '🎨', '전시회, 공연 등을 즐길 수 있는 문화공간'),
('쇼핑', 'shopping', '🛍️', '쇼핑을 즐길 수 있는 상점과 백화점'),
('액티비티', 'activity', '🏃‍♀️', '체험하고 활동할 수 있는 재미있는 공간');

-- 시간대 데이터
INSERT INTO time_slots (name, slug, start_time, end_time, description) VALUES
('점심 시간', 'lunch', '12:00', '14:00', '맛있는 점심을 즐기기 좋은 시간'),
('오후 시간', 'afternoon', '14:00', '17:00', '여유로운 산책과 카페 타임'),
('저녁 시간', 'evening', '17:00', '21:00', '로맨틱한 저녁과 야경을 즐기는 시간'),
('밤 시간', 'night', '21:00', '24:00', '조용한 분위기에서 대화를 나누는 시간');

-- 샘플 장소 데이터 (성수동)
INSERT INTO places (
  name, description, address, latitude, longitude, phone, website, rating, price_range, 
  is_partnership, operating_hours, tags, region_id, category_id
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
  (SELECT id FROM categories WHERE slug = 'cafe')
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
  (SELECT id FROM categories WHERE slug = 'shopping')
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
  (SELECT id FROM categories WHERE slug = 'walking')
);

-- 장소-시간대 연결 데이터
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
((SELECT id FROM places WHERE name = '한강공원 뚝섬유원지'), (SELECT id FROM time_slots WHERE slug = 'lunch'), 3);

-- 관리자 사용자 역할 설정
-- 주의: 실제 사용자가 회원가입한 후 해당 user_id로 수동 업데이트 필요
-- 예시: 특정 이메일의 사용자를 관리자로 설정하려면 아래 쿼리 실행
-- INSERT INTO user_roles (user_id, role) 
-- SELECT id, 'admin' FROM auth.users WHERE email = 'admin@example.com'; 