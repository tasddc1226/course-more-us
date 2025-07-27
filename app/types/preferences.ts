// 사용자 선호도 관련 타입 정의

export interface TimeSlot {
  day: 'weekday' | 'weekend';
  time: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface ThemePreference {
  theme: 'romantic' | 'activity' | 'culture' | 'food' | 'nature';
  weight: number; // 0.0 ~ 1.0
}

export interface AccessibilityNeeds {
  wheelchairAccess: boolean;
  parkingRequired: boolean;
  publicTransportOnly: boolean;
  elevatorRequired: boolean;
}

export interface UserPreferenceProfile {
  userId: string;
  preferences: {
    categories: Record<string, number>; // 카테고리별 선호도 점수
    priceRange: { 
      min: number; 
      max: number; 
    };
    timePreferences: TimeSlot[]; // 선호 시간대
    themes: ThemePreference[]; // 테마별 선호도
    accessibility: AccessibilityNeeds;
    groupSize: number; // 선호 그룹 크기
  };
  behaviorMetrics: {
    avgCourseCompletionRate: number;
    preferredCourseLength: number; // 선호 코스 장소 수
    avgSpendingPerCourse: number;
    totalCoursesGenerated: number;
    totalPlacesVisited: number;
  };
  learningHistory: PreferenceLearningEvent[];
}

export type EventType = 'like' | 'dislike' | 'visit' | 'view' | 'skip' | 'save' | 'share';
export type TargetType = 'place' | 'course' | 'category';

export interface PreferenceLearningEvent {
  id: string;
  userId: string;
  eventType: EventType;
  targetType: TargetType;
  targetId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface CourseEditHistory {
  id: string;
  courseId: string;
  userId: string;
  originalCourse: any; // GeneratedCourse type from existing types
  editedCourse: any; // GeneratedCourse type from existing types
  changes: CourseEditChanges;
  createdAt: string;
}

export interface CourseEditChanges {
  placesAdded: string[];
  placesRemoved: string[];
  placesReordered: boolean;
  timeAllocationsChanged: Record<string, { from: number; to: number }>;
  totalDurationChanged: { from: number; to: number };
}

// 고급 필터 타입
export interface AdvancedFilters {
  budget: {
    min: number;
    max: number;
    includeTransport: boolean;
  };
  accessibility: {
    wheelchairAccess: boolean;
    parkingRequired: boolean;
    publicTransportOnly: boolean;
    elevatorRequired: boolean;
  };
  weather: {
    considerWeather: boolean;
    preferIndoor: boolean;
  };
  group: {
    size: number;
    hasChildren: boolean;
    hasSeniors: boolean;
  };
  timeSlots: TimeSlot[];
}

// 선호도 점수 계산 관련 타입
export interface PreferenceScore {
  categoryScores: Record<string, number>;
  themeScores: Record<string, number>;
  overallScore: number;
  confidence: number; // 0.0 ~ 1.0, 학습 데이터 충분도
}

// 선호도 업데이트 요청 타입
export interface UpdatePreferencesRequest {
  categoryPreferences?: Record<string, number>;
  priceRangeMin?: number;
  priceRangeMax?: number;
  preferredThemes?: string[];
  accessibilityNeeds?: Partial<AccessibilityNeeds>;
  preferredTimeSlots?: string[];
  groupSizePreference?: number;
}

// 선호도 학습 이벤트 생성 요청 타입
export interface CreateLearningEventRequest {
  eventType: EventType;
  targetType: TargetType;
  targetId: string;
  metadata?: Record<string, any>;
}