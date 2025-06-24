-- Add latitude and longitude fields to places table for Kakao Map API integration

-- Add latitude and longitude columns
ALTER TABLE places 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Add index for location-based queries
CREATE INDEX idx_places_location ON places(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN places.latitude IS '위도 (Latitude) - 카카오 지도 API에서 가져온 위치 정보';
COMMENT ON COLUMN places.longitude IS '경도 (Longitude) - 카카오 지도 API에서 가져온 위치 정보';

-- Update existing places with default Seoul coordinates (optional - for existing data)
-- This can be removed if you prefer to leave existing data as NULL
-- UPDATE places 
-- SET latitude = 37.5665, longitude = 126.9780 
-- WHERE latitude IS NULL AND longitude IS NULL AND source = 'admin'; 