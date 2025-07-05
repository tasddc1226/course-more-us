-- 🔧 Add User Place Time Slots Management Policy
-- 사용자가 자신이 등록한 장소의 시간대 정보를 관리할 수 있는 정책 추가
-- 2025-01-05

-- ============================================================================
-- 1. 사용자가 자신이 등록한 장소의 시간대 정보 관리 정책 추가
-- ============================================================================

-- 1-1. 사용자가 자신이 등록한 장소의 시간대 정보 삽입 가능
CREATE POLICY "Users can insert time slots for their own places" ON place_time_slots 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM places 
      WHERE places.id = place_time_slots.place_id 
      AND places.user_id = auth.uid() 
      AND places.source = 'user'
    )
  );

-- 1-2. 사용자가 자신이 등록한 장소의 시간대 정보 수정 가능
CREATE POLICY "Users can update time slots for their own places" ON place_time_slots 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM places 
      WHERE places.id = place_time_slots.place_id 
      AND places.user_id = auth.uid() 
      AND places.source = 'user'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM places 
      WHERE places.id = place_time_slots.place_id 
      AND places.user_id = auth.uid() 
      AND places.source = 'user'
    )
  );

-- 1-3. 사용자가 자신이 등록한 장소의 시간대 정보 삭제 가능
CREATE POLICY "Users can delete time slots for their own places" ON place_time_slots 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM places 
      WHERE places.id = place_time_slots.place_id 
      AND places.user_id = auth.uid() 
      AND places.source = 'user'
    )
  );

-- ============================================================================
-- 2. 정책 적용 완료 후 최적화
-- ============================================================================

-- 통계 정보 업데이트 (정책 성능 최적화)
ANALYZE place_time_slots;
ANALYZE places;

-- 완료 알림
COMMENT ON TABLE place_time_slots IS 'Place time slots with user management policies - Updated 2025-01-05'; 