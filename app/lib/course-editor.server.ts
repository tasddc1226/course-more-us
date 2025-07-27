import { createClient } from '~/lib/supabase.server';
import type { CourseEditHistory, CourseEditChanges } from '~/types/preferences';
import type { DateCourse } from '~/types/course';

// 코스 편집 이력 저장
export async function saveCourseEditHistory(
  request: Request,
  courseId: string,
  userId: string,
  originalCourse: DateCourse,
  editedCourse: DateCourse
): Promise<CourseEditHistory | null> {
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
}

// 코스 편집 이력 조회
export async function getCourseEditHistory(
  request: Request,
  courseId: string,
  userId: string
): Promise<CourseEditHistory[]> {
  const supabase = createClient(request);

  const { data, error } = await supabase
    .from('course_edit_history')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch course edit history:', error);
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
}

// 편집된 코스 저장
export async function saveEditedCourse(
  request: Request,
  courseId: string,
  userId: string,
  editedCourse: DateCourse
): Promise<boolean> {
  const supabase = createClient(request);

  // 원본 코스 조회
  const { data: originalCourse, error: fetchError } = await supabase
    .from('generated_courses')
    .select('*')
    .eq('id', courseId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !originalCourse) {
    console.error('Failed to fetch original course:', fetchError);
    return false;
  }

  // 편집 이력 저장
  const history = await saveCourseEditHistory(
    request,
    courseId,
    userId,
    originalCourse.course_data,
    editedCourse
  );

  if (!history) {
    return false;
  }

  // 코스 업데이트
  const { error: updateError } = await supabase
    .from('generated_courses')
    .update({
      course_data: editedCourse,
      updated_at: new Date().toISOString()
    })
    .eq('id', courseId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update course:', updateError);
    return false;
  }

  return true;
}

// 코스 복제 (Fork)
export async function forkCourse(
  request: Request,
  courseId: string,
  userId: string,
  newName?: string
): Promise<string | null> {
  const supabase = createClient(request);

  // 원본 코스 조회
  const { data: originalCourse, error: fetchError } = await supabase
    .from('generated_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (fetchError || !originalCourse) {
    console.error('Failed to fetch course to fork:', fetchError);
    return null;
  }

  // 복제된 코스 생성
  const forkedCourseData = {
    ...originalCourse.course_data,
    name: newName || `${originalCourse.course_data.name} (복사본)`,
    forkedFrom: courseId
  };

  const { data: newCourse, error: createError } = await supabase
    .from('generated_courses')
    .insert({
      user_id: userId,
      search_query: originalCourse.search_query,
      theme: originalCourse.theme,
      course_data: forkedCourseData,
      is_ai_generated: false // 복제된 코스는 AI 생성이 아님
    })
    .select()
    .single();

  if (createError || !newCourse) {
    console.error('Failed to create forked course:', createError);
    return null;
  }

  return newCourse.id;
}

// 편집 차이점 계산
export function calculateEditDiff(
  original: DateCourse,
  edited: DateCourse
): CourseEditChanges {
  const changes: CourseEditChanges = {
    placesAdded: [],
    placesRemoved: [],
    placesReordered: false,
    timeAllocationsChanged: {},
    totalDurationChanged: {
      from: 0,
      to: 0
    }
  };

  // 장소 추가/제거 확인
  const originalPlaceIds = new Set(original.places.map(p => p.place.id));
  const editedPlaceIds = new Set(edited.places.map(p => p.place.id));

  // 추가된 장소
  edited.places.forEach(place => {
    if (!originalPlaceIds.has(place.place.id)) {
      changes.placesAdded.push(place.place.id.toString());
    }
  });

  // 제거된 장소
  original.places.forEach(place => {
    if (!editedPlaceIds.has(place.place.id)) {
      changes.placesRemoved.push(place.place.id.toString());
    }
  });

  // 순서 변경 확인
  const commonPlaces = original.places.filter(p => editedPlaceIds.has(p.place.id));
  const editedCommonPlaces = edited.places.filter(p => originalPlaceIds.has(p.place.id));
  
  if (commonPlaces.length === editedCommonPlaces.length) {
    for (let i = 0; i < commonPlaces.length; i++) {
      if (commonPlaces[i].place.id !== editedCommonPlaces[i].place.id) {
        changes.placesReordered = true;
        break;
      }
    }
  }

  // 시간 할당 변경 확인
  const originalTimeMap = new Map(
    original.places.map(p => [p.place.id, p.suggestedDuration || 60])
  );
  const editedTimeMap = new Map(
    edited.places.map(p => [p.place.id, p.suggestedDuration || 60])
  );

  originalTimeMap.forEach((originalTime, placeId) => {
    const editedTime = editedTimeMap.get(placeId);
    if (editedTime !== undefined && editedTime !== originalTime) {
      changes.timeAllocationsChanged[placeId.toString()] = {
        from: originalTime,
        to: editedTime
      };
    }
  });

  // 총 시간 변경 확인
  const originalTotal = original.places.reduce(
    (sum, p) => sum + (p.suggestedDuration || 60), 0
  );
  const editedTotal = edited.places.reduce(
    (sum, p) => sum + (p.suggestedDuration || 60), 0
  );

  changes.totalDurationChanged = {
    from: originalTotal,
    to: editedTotal
  };

  return changes;
}

// 편집 제안 생성
export async function generateEditSuggestions(
  request: Request,
  course: DateCourse,
  constraints: {
    maxDuration?: number;
    budget?: number;
    mustVisitPlaceIds?: string[];
  }
): Promise<{
  suggestions: string[];
  alternativePlaces: any[];
}> {
  const suggestions: string[] = [];
  const alternativePlaces: any[] = [];

  // 시간 제약 확인
  if (constraints.maxDuration) {
    const totalDuration = course.places.reduce(
      (sum, p) => sum + (p.suggestedDuration || 60), 0
    );
    
    if (totalDuration > constraints.maxDuration) {
      const excessTime = totalDuration - constraints.maxDuration;
      suggestions.push(
        `코스 총 시간이 ${Math.floor(excessTime / 60)}시간 ${excessTime % 60}분 초과합니다. 일부 장소의 체류 시간을 줄이거나 장소를 제거해보세요.`
      );
    }
  }

  // 예산 제약 확인
  if (constraints.budget) {
    const estimatedCost = course.estimatedCost.max;
    
    if (estimatedCost > constraints.budget) {
      suggestions.push(
        `예상 비용이 예산을 ${(estimatedCost - constraints.budget).toLocaleString()}원 초과합니다. 저렴한 대안을 고려해보세요.`
      );
    }
  }

  // 필수 방문 장소 확인
  if (constraints.mustVisitPlaceIds && constraints.mustVisitPlaceIds.length > 0) {
    const coursePlaceIds = new Set(course.places.map(p => p.place.id.toString()));
    const missingPlaces = constraints.mustVisitPlaceIds.filter(
      id => !coursePlaceIds.has(id)
    );
    
    if (missingPlaces.length > 0) {
      suggestions.push(
        `필수 방문 장소 ${missingPlaces.length}개가 코스에 포함되지 않았습니다.`
      );
    }
  }

  // TODO: 대안 장소 조회 로직 구현
  // 비슷한 카테고리의 다른 장소들을 추천

  return {
    suggestions,
    alternativePlaces
  };
}

// 코스 유효성 검증
export function validateEditedCourse(course: DateCourse): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 최소 장소 수 확인
  if (course.places.length < 2) {
    errors.push('코스는 최소 2개 이상의 장소를 포함해야 합니다.');
  }

  // 최대 장소 수 확인
  if (course.places.length > 10) {
    errors.push('코스는 최대 10개까지의 장소만 포함할 수 있습니다.');
  }

  // 각 장소의 시간 할당 확인
  course.places.forEach((place, index) => {
    if (!place.suggestedDuration || place.suggestedDuration < 15) {
      errors.push(`${index + 1}번째 장소의 체류 시간이 너무 짧습니다 (최소 15분).`);
    }
    if (place.suggestedDuration > 480) {
      errors.push(`${index + 1}번째 장소의 체류 시간이 너무 깁니다 (최대 8시간).`);
    }
  });

  // 총 시간 확인
  const totalDuration = course.places.reduce(
    (sum, p) => sum + (p.suggestedDuration || 60), 0
  );
  
  if (totalDuration > 720) { // 12시간
    errors.push('코스 총 시간이 12시간을 초과합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}