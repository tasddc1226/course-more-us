// import { createClient } from '~/lib/supabase.server'; // Disabled until course_edit_history table available
import type { DateCourse } from '~/types/course';

// TODO: Re-enable when course_edit_history table is created in remote database
// import type { CourseEditHistory, CourseEditChanges } from '~/types/preferences';

// 코스 편집 이력 저장 - TEMPORARILY DISABLED
export async function saveCourseEditHistory(
  _request: Request,
  _courseId: string,
  _userId: string,
  _originalCourse: DateCourse,
  _editedCourse: DateCourse
): Promise<any | null> {
  // TODO: Re-enable when course_edit_history table is available
  console.warn('saveCourseEditHistory is temporarily disabled - course_edit_history table missing');
  return null;
  
  /*
  const supabase = createClient(request);

  // 변경사항 계산
  const changes = calculateEditDiff(originalCourse, editedCourse);

  const { data, error } = await supabase
    .from('course_edit_history')
    .insert({
      course_id: courseId,
      user_id: userId,
      original_course: originalCourse,
      edited_course: editedCourse,
      changes: changes
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save course edit history:', error);
    return null;
  }

  return {
    id: data.id,
    courseId: data.course_id,
    userId: data.user_id,
    originalCourse: data.original_course,
    editedCourse: data.edited_course,
    changes: data.changes,
    createdAt: data.created_at
  };
  */
}

// 코스 편집 이력 조회 - TEMPORARILY DISABLED
export async function getCourseEditHistory(
  _request: Request,
  _courseId: string,
  _userId: string
): Promise<any[]> {
  // TODO: Re-enable when course_edit_history table is available
  console.warn('getCourseEditHistory is temporarily disabled - course_edit_history table missing');
  return [];
  
  /*
  const supabase = createClient(request);

  const { data, error } = await supabase
    .from('course_edit_history')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get course edit history:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    courseId: item.course_id,
    userId: item.user_id,
    originalCourse: item.original_course,
    editedCourse: item.edited_course,
    changes: item.changes,
    createdAt: item.created_at
  }));
  */
}

// 변경사항 계산 헬퍼 함수 - TEMPORARILY DISABLED
export function calculateEditDiff(
  _originalCourse: DateCourse,
  _editedCourse: DateCourse
): any {
  // TODO: Re-enable when course_edit_history table is available
  console.warn('calculateEditDiff is temporarily disabled');
  return {};
  
  /*
  const changes: CourseEditChanges = {
    placesAdded: [],
    placesRemoved: [],
    placesReordered: [],
    timeChanged: false
  };

  // 간단한 diff 구현
  const originalPlaceIds = originalCourse.places.map(p => p.id);
  const editedPlaceIds = editedCourse.places.map(p => p.id);

  // 추가된 장소들
  changes.placesAdded = editedPlaceIds.filter(id => !originalPlaceIds.includes(id));
  
  // 제거된 장소들
  changes.placesRemoved = originalPlaceIds.filter(id => !editedPlaceIds.includes(id));

  // 순서 변경 체크
  const commonPlaces = originalPlaceIds.filter(id => editedPlaceIds.includes(id));
  changes.placesReordered = commonPlaces.some((id, index) => {
    const originalIndex = originalPlaceIds.indexOf(id);
    const editedIndex = editedPlaceIds.indexOf(id);
    return originalIndex !== editedIndex;
  });

  // 시간 변경 체크 (간단히 총 시간으로 비교)
  changes.timeChanged = originalCourse.totalDuration !== editedCourse.totalDuration;

  return changes;
  */
}

// TODO: Implement when course_edit_history table is available
export async function saveEditedCourse(
  _request: Request,
  _courseId: string,
  _editedCourse: DateCourse
): Promise<any> {
  console.warn('saveEditedCourse is temporarily disabled');
  return null;
}

// TODO: Implement when course_edit_history table is available
export async function validateEditedCourse(
  _courseData: DateCourse
): Promise<{ isValid: boolean; errors: string[] }> {
  console.warn('validateEditedCourse is temporarily disabled');
  return { isValid: true, errors: [] };
}

// TODO: Implement when course_edit_history table is available
export async function forkCourse(
  _request: Request,
  _originalCourseId: string,
  _userId: string,
  _newName?: string
): Promise<any> {
  console.warn('forkCourse is temporarily disabled');
  return null;
}