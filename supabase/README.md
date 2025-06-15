# 코스모스 데이터베이스 설정 가이드

## 📊 데이터베이스 스키마 개요

코스모스 서비스의 데이터베이스는 다음과 같은 구조로 설계되었습니다:

### 주요 테이블
- **regions**: 지역 정보 (성수동, 강남, 홍대 등)
- **categories**: 장소 카테고리 (카페, 음식점, 산책로 등)
- **time_slots**: 시간대 (점심, 오후, 저녁, 밤)
- **places**: 장소 정보 (메인 테이블)
- **place_time_slots**: 장소-시간대 연결 (M:N 관계)
- **place_images**: 장소 이미지

## 🚀 설정 방법

### 1. Supabase 프로젝트에서 SQL 실행

1. **Supabase 대시보드** 접속
2. 왼쪽 사이드바에서 **SQL Editor** 클릭
3. **New Query** 버튼 클릭
4. `schema.sql` 파일의 내용을 복사해서 붙여넣기
5. **Run** 버튼 클릭하여 테이블 생성
6. `seed.sql` 파일의 내용을 복사해서 붙여넣기
7. **Run** 버튼 클릭하여 초기 데이터 입력

### 2. RLS (Row Level Security) 정책

- **읽기 권한**: 모든 사용자 (인증 여부 무관)
- **쓰기 권한**: 인증된 사용자만 (관리자 기능용)

### 3. 인덱스 최적화

다음 필드에 인덱스가 설정되어 성능 최적화:
- `places.region_id`
- `places.category_id`
- `places.is_active`
- `places.is_partnership`
- `places.rating`

## 📋 데이터 구조 상세

### places 테이블 주요 필드

```sql
- name: 장소명
- description: 설명
- address: 주소
- latitude/longitude: 위도/경도 (지도 표시용)
- rating: 평점 (0.0 ~ 5.0)
- price_range: 가격대 (1: 저렴 ~ 4: 비싼)
- is_partnership: 제휴 여부
- operating_hours: 영업시간 (JSON 형태)
- tags: 태그 배열
```

### 영업시간 JSON 형태 예시

```json
{
  "monday": "09:00-22:00",
  "tuesday": "09:00-22:00",
  "wednesday": "09:00-22:00",
  "thursday": "09:00-22:00",
  "friday": "09:00-22:00",
  "saturday": "10:00-22:00",
  "sunday": "10:00-22:00"
}
```

## 🔄 추천 로직

### 시간대별 우선순위
- **점심 (12:00-14:00)**: 음식점 위주
- **오후 (14:00-17:00)**: 카페, 산책로
- **저녁 (17:00-21:00)**: 펍, 야경 산책
- **밤 (21:00-24:00)**: 조용한 바, 카페

### 정렬 기준
1. 제휴 장소 우선 (`is_partnership = true`)
2. 시간대별 우선순위 (`place_time_slots.priority`)
3. 평점 높은 순 (`rating DESC`)

## 🛠 확장 계획

향후 추가 예정인 테이블들:
- **reviews**: 사용자 리뷰
- **favorites**: 즐겨찾기
- **date_courses**: 저장된 데이트 코스
- **user_preferences**: 사용자 선호도

## 📝 예시 쿼리

### 성수동 오후 시간대 카페 추천
```sql
SELECT p.*, c.name as category_name, r.name as region_name
FROM places p
JOIN categories c ON p.category_id = c.id
JOIN regions r ON p.region_id = r.id
JOIN place_time_slots pts ON p.id = pts.place_id
JOIN time_slots ts ON pts.time_slot_id = ts.id
WHERE r.slug = 'seongsu'
  AND c.slug = 'cafe'
  AND ts.slug = 'afternoon'
  AND p.is_active = true
ORDER BY p.is_partnership DESC, pts.priority ASC, p.rating DESC;
``` 