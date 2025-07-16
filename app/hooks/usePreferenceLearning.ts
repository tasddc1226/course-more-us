import { useCallback } from 'react';

export type PreferenceLearningEventType = 'like' | 'dislike' | 'visit' | 'view' | 'skip' | 'save' | 'share';
export type TargetType = 'place' | 'course' | 'category';

interface LearningEvent {
  eventType: PreferenceLearningEventType;
  targetType: TargetType;
  targetId: string;
  metadata?: Record<string, any>;
}

export function usePreferenceLearning() {
  const recordEvent = useCallback(async (event: LearningEvent) => {
    try {
      const response = await fetch('/api/preferences/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to record learning event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording preference learning event:', error);
      return { success: false, error };
    }
  }, []);

  // 장소 좋아요/싫어요
  const likePlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'like',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  const dislikePlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'dislike',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  // 장소 방문 기록
  const visitPlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'visit',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  // 장소 조회 기록
  const viewPlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'view',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  // 장소 건너뛰기
  const skipPlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'skip',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  // 장소 저장
  const savePlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'save',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  // 장소 공유
  const sharePlace = useCallback((placeId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'share',
      targetType: 'place',
      targetId: placeId,
      metadata,
    });
  }, [recordEvent]);

  // 코스 관련 이벤트
  const likeCourse = useCallback((courseId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'like',
      targetType: 'course',
      targetId: courseId,
      metadata,
    });
  }, [recordEvent]);

  const dislikeCourse = useCallback((courseId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'dislike',
      targetType: 'course',
      targetId: courseId,
      metadata,
    });
  }, [recordEvent]);

  const viewCourse = useCallback((courseId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'view',
      targetType: 'course',
      targetId: courseId,
      metadata,
    });
  }, [recordEvent]);

  const saveCourse = useCallback((courseId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'save',
      targetType: 'course',
      targetId: courseId,
      metadata,
    });
  }, [recordEvent]);

  const shareCourse = useCallback((courseId: string, metadata?: Record<string, any>) => {
    return recordEvent({
      eventType: 'share',
      targetType: 'course',
      targetId: courseId,
      metadata,
    });
  }, [recordEvent]);

  return {
    recordEvent,
    // 장소 관련
    likePlace,
    dislikePlace,
    visitPlace,
    viewPlace,
    skipPlace,
    savePlace,
    sharePlace,
    // 코스 관련
    likeCourse,
    dislikeCourse,
    viewCourse,
    saveCourse,
    shareCourse,
  };
}