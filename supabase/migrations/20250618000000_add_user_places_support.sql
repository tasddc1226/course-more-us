-- 유저 장소 등록 지원을 위한 마이그레이션

-- 1. Storage 버킷 생성 (place-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('place-images', 'place-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage 정책 생성
-- 인증된 사용자는 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'place-images' AND auth.uid() IS NOT NULL
);

-- 모든 사용자는 이미지 조회 가능 (public bucket)
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (
  bucket_id = 'place-images'
);

-- 자신이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (
  bucket_id = 'place-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- places 테이블에 user_id와 source 필드 추가
ALTER TABLE places 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN source VARCHAR(10) DEFAULT 'admin' CHECK (source IN ('admin', 'user'));

-- user_id 인덱스 추가
CREATE INDEX idx_places_user_id ON places(user_id);
CREATE INDEX idx_places_source ON places(source);

-- 유저 장소 관리를 위한 RLS 정책 추가
-- 유저는 자신이 등록한 장소만 삭제 가능
CREATE POLICY "Users can delete their own places" ON places FOR DELETE USING (
  user_id = auth.uid() AND source = 'user'
);

-- 유저는 자신의 장소를 조회 가능
CREATE POLICY "Users can view their own places" ON places FOR SELECT USING (
  user_id = auth.uid() OR is_active = true
);

-- 인증된 유저는 장소 등록 가능 (하루 3개 제한은 애플리케이션 레벨에서 처리)
CREATE POLICY "Authenticated users can insert places" ON places FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND source = 'user'
);

-- 기존 관리자 정책 업데이트 (admin 권한 체크 추가)
DROP POLICY IF EXISTS "Authenticated users can manage places" ON places;

CREATE POLICY "Admins can manage all places" ON places FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 기존 데이터는 모두 admin source로 설정
UPDATE places SET source = 'admin' WHERE source IS NULL;

-- source 필드 NOT NULL 제약 추가
ALTER TABLE places ALTER COLUMN source SET NOT NULL;