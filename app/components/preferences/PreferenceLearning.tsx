import { useEffect } from 'react';
import { usePreferenceLearning } from '~/hooks/usePreferenceLearning';

interface PreferenceLearningProps {
  children: React.ReactNode;
}

export function PreferenceLearning({ children }: PreferenceLearningProps) {
  const {
    viewPlace,
    viewCourse,
    likePlace,
    dislikePlace,
    saveCourse,
    shareCourse,
  } = usePreferenceLearning();

  useEffect(() => {
    // 장소 카드 클릭 추적
    const handlePlaceClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const placeCard = target.closest('[data-place-id]');
      
      if (placeCard) {
        const placeId = placeCard.getAttribute('data-place-id');
        const category = placeCard.getAttribute('data-category');
        const tags = placeCard.getAttribute('data-tags');
        
        if (placeId) {
          viewPlace(placeId, {
            category,
            tags: tags ? tags.split(',') : [],
            timestamp: Date.now(),
            source: 'click',
          });
        }
      }
    };

    // 코스 카드 클릭 추적
    const handleCourseClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const courseCard = target.closest('[data-course-id]');
      
      if (courseCard) {
        const courseId = courseCard.getAttribute('data-course-id');
        const theme = courseCard.getAttribute('data-theme');
        
        if (courseId) {
          viewCourse(courseId, {
            theme,
            timestamp: Date.now(),
            source: 'click',
          });
        }
      }
    };

    // 좋아요 버튼 클릭 추적
    const handleLikeClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const likeButton = target.closest('[data-like-button]');
      
      if (likeButton) {
        event.stopPropagation();
        const placeId = likeButton.getAttribute('data-place-id');
        const isLiked = likeButton.getAttribute('data-liked') === 'true';
        
        if (placeId) {
          if (isLiked) {
            dislikePlace(placeId, {
              timestamp: Date.now(),
              source: 'like_button',
            });
          } else {
            likePlace(placeId, {
              timestamp: Date.now(),
              source: 'like_button',
            });
          }
        }
      }
    };

    // 저장 버튼 클릭 추적
    const handleSaveClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const saveButton = target.closest('[data-save-button]');
      
      if (saveButton) {
        event.stopPropagation();
        const courseId = saveButton.getAttribute('data-course-id');
        
        if (courseId) {
          saveCourse(courseId, {
            timestamp: Date.now(),
            source: 'save_button',
          });
        }
      }
    };

    // 공유 버튼 클릭 추적
    const handleShareClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const shareButton = target.closest('[data-share-button]');
      
      if (shareButton) {
        event.stopPropagation();
        const courseId = shareButton.getAttribute('data-course-id');
        
        if (courseId) {
          shareCourse(courseId, {
            timestamp: Date.now(),
            source: 'share_button',
          });
        }
      }
    };

    // 스크롤 기반 조회 시간 추적
    const observedElements = new Map<Element, number>();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;
          
          if (entry.isIntersecting) {
            // 요소가 뷰포트에 들어올 때 시작 시간 기록
            observedElements.set(element, Date.now());
          } else {
            // 요소가 뷰포트를 벗어날 때 조회 시간 계산
            const startTime = observedElements.get(element);
            if (startTime) {
              const viewDuration = Date.now() - startTime;
              
              // 2초 이상 봤으면 조회로 간주
              if (viewDuration >= 2000) {
                const placeId = element.getAttribute('data-place-id');
                const courseId = element.getAttribute('data-course-id');
                
                if (placeId) {
                  viewPlace(placeId, {
                    viewDuration,
                    timestamp: Date.now(),
                    source: 'scroll',
                  });
                } else if (courseId) {
                  viewCourse(courseId, {
                    viewDuration,
                    timestamp: Date.now(),
                    source: 'scroll',
                  });
                }
              }
              
              observedElements.delete(element);
            }
          }
        });
      },
      { threshold: 0.5 } // 50% 이상 보일 때
    );

    // 이벤트 리스너 등록
    document.addEventListener('click', handlePlaceClick);
    document.addEventListener('click', handleCourseClick);
    document.addEventListener('click', handleLikeClick);
    document.addEventListener('click', handleSaveClick);
    document.addEventListener('click', handleShareClick);

    // 관찰할 요소들 찾기 및 등록
    const placeCards = document.querySelectorAll('[data-place-id]');
    const courseCards = document.querySelectorAll('[data-course-id]');
    
    [...placeCards, ...courseCards].forEach(card => {
      observer.observe(card);
    });

    return () => {
      document.removeEventListener('click', handlePlaceClick);
      document.removeEventListener('click', handleCourseClick);
      document.removeEventListener('click', handleLikeClick);
      document.removeEventListener('click', handleSaveClick);
      document.removeEventListener('click', handleShareClick);
      observer.disconnect();
    };
  }, [viewPlace, viewCourse, likePlace, dislikePlace, saveCourse, shareCourse]);

  return <>{children}</>;
}

// 장소 카드에 추가할 속성들을 위한 유틸리티 함수
export function getPlaceTrackingAttributes(place: any) {
  return {
    'data-place-id': place.id,
    'data-category': place.category,
    'data-tags': place.tags?.join(',') || '',
  };
}

// 코스 카드에 추가할 속성들을 위한 유틸리티 함수
export function getCourseTrackingAttributes(course: any) {
  return {
    'data-course-id': course.id,
    'data-theme': course.theme,
  };
}

// 좋아요 버튼에 추가할 속성들
export function getLikeButtonAttributes(placeId: string, isLiked: boolean) {
  return {
    'data-like-button': 'true',
    'data-place-id': placeId,
    'data-liked': isLiked.toString(),
  };
}

// 저장 버튼에 추가할 속성들
export function getSaveButtonAttributes(courseId: string) {
  return {
    'data-save-button': 'true',
    'data-course-id': courseId,
  };
}

// 공유 버튼에 추가할 속성들
export function getShareButtonAttributes(courseId: string) {
  return {
    'data-share-button': 'true',
    'data-course-id': courseId,
  };
}