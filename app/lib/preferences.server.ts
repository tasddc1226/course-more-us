import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

type PreferenceLearningEventType = 'like' | 'dislike' | 'visit' | 'view' | 'skip' | 'save' | 'share';
type TargetType = 'place' | 'course' | 'category';

export interface UserPreferences {
  id: string;
  userId: string;
  categoryPreferences: Record<string, number>;
  priceRangeMin: number;
  priceRangeMax: number;
  preferredThemes: string[];
  accessibilityNeeds: Record<string, boolean>;
  preferredTimeSlots: string[];
  groupSizePreference: number;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceLearningEvent {
  eventType: PreferenceLearningEventType;
  targetType: TargetType;
  targetId: string;
  metadata?: Record<string, any>;
}

// 사용자 선호도 가져오기
export async function getUserPreferences(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 선호도가 없는 경우 기본값으로 생성
      return createDefaultUserPreferences(supabase, userId);
    }
    console.error('Error fetching user preferences:', error);
    return null;
  }

  return formatUserPreferences(data);
}

// 기본 선호도 생성
async function createDefaultUserPreferences(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserPreferences | null> {
  const defaultPreferences = {
    user_id: userId,
    category_preferences: {},
    price_range_min: 0,
    price_range_max: 100000,
    preferred_themes: [],
    accessibility_needs: {},
    preferred_time_slots: [],
    group_size_preference: 2,
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(defaultPreferences)
    .select()
    .single();

  if (error) {
    console.error('Error creating default preferences:', error);
    return null;
  }

  return formatUserPreferences(data);
}

// 선호도 업데이트
export async function updateUserPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences | null> {
  const updateData: any = {};
  
  if (preferences.categoryPreferences !== undefined) {
    updateData.category_preferences = preferences.categoryPreferences;
  }
  if (preferences.priceRangeMin !== undefined) {
    updateData.price_range_min = preferences.priceRangeMin;
  }
  if (preferences.priceRangeMax !== undefined) {
    updateData.price_range_max = preferences.priceRangeMax;
  }
  if (preferences.preferredThemes !== undefined) {
    updateData.preferred_themes = preferences.preferredThemes;
  }
  if (preferences.accessibilityNeeds !== undefined) {
    updateData.accessibility_needs = preferences.accessibilityNeeds;
  }
  if (preferences.preferredTimeSlots !== undefined) {
    updateData.preferred_time_slots = preferences.preferredTimeSlots;
  }
  if (preferences.groupSizePreference !== undefined) {
    updateData.group_size_preference = preferences.groupSizePreference;
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    return null;
  }

  return formatUserPreferences(data);
}

// 학습 이벤트 기록
export async function recordLearningEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  event: PreferenceLearningEvent
): Promise<boolean> {
  const { error } = await supabase
    .from('preference_learning_events')
    .insert({
      user_id: userId,
      event_type: event.eventType,
      target_type: event.targetType,
      target_id: event.targetId,
      metadata: event.metadata || {},
    });

  if (error) {
    console.error('Error recording learning event:', error);
    return false;
  }

  // 이벤트 기록 후 선호도 업데이트
  await updatePreferencesFromEvent(supabase, userId, event);
  
  return true;
}

// 이벤트를 기반으로 선호도 업데이트
async function updatePreferencesFromEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  event: PreferenceLearningEvent
): Promise<void> {
  const preferences = await getUserPreferences(supabase, userId);
  if (!preferences) return;

  // 카테고리 선호도 업데이트 로직
  if (event.targetType === 'place' && event.metadata?.category) {
    const category = event.metadata.category as string;
    const currentScore = preferences.categoryPreferences[category] || 0;
    
    let scoreChange = 0;
    switch (event.eventType) {
      case 'like':
        scoreChange = 10;
        break;
      case 'dislike':
        scoreChange = -10;
        break;
      case 'visit':
        scoreChange = 15;
        break;
      case 'view':
        scoreChange = 2;
        break;
      case 'skip':
        scoreChange = -2;
        break;
      case 'save':
        scoreChange = 8;
        break;
      case 'share':
        scoreChange = 12;
        break;
    }

    preferences.categoryPreferences[category] = Math.max(0, Math.min(100, currentScore + scoreChange));
    
    await updateUserPreferences(supabase, userId, {
      categoryPreferences: preferences.categoryPreferences,
    });
  }

  // 가격대 선호도 업데이트 (방문한 장소의 가격대를 학습)
  if (event.eventType === 'visit' && event.metadata?.price) {
    const price = event.metadata.price as number;
    const currentMin = preferences.priceRangeMin;
    const currentMax = preferences.priceRangeMax;
    
    // 방문한 장소의 가격을 바탕으로 선호 가격대 조정
    const newMin = Math.min(currentMin, price * 0.8);
    const newMax = Math.max(currentMax, price * 1.2);
    
    await updateUserPreferences(supabase, userId, {
      priceRangeMin: Math.floor(newMin),
      priceRangeMax: Math.ceil(newMax),
    });
  }
}

// 사용자의 최근 학습 이벤트 가져오기
export async function getRecentLearningEvents(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 100
): Promise<PreferenceLearningEvent[]> {
  const { data, error } = await supabase
    .from('preference_learning_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching learning events:', error);
    return [];
  }

  return data.map(event => ({
    eventType: event.event_type as PreferenceLearningEventType,
    targetType: event.target_type as TargetType,
    targetId: event.target_id,
    metadata: event.metadata as Record<string, any>,
  }));
}

// 선호도 기반 점수 계산
export function calculatePreferenceScore(
  preferences: UserPreferences,
  place: any
): number {
  let score = 50; // 기본 점수

  // 카테고리 선호도 반영
  if (place.category && preferences.categoryPreferences[place.category]) {
    score += preferences.categoryPreferences[place.category] * 0.3;
  }

  // 가격대 매칭
  if (place.price_level) {
    const avgPrice = place.price_level * 20000; // 대략적인 가격 계산
    if (avgPrice >= preferences.priceRangeMin && avgPrice <= preferences.priceRangeMax) {
      score += 10;
    } else {
      score -= 10;
    }
  }

  // 테마 매칭
  if (place.tags && preferences.preferredThemes.length > 0) {
    const matchingThemes = place.tags.filter((tag: string) => 
      preferences.preferredThemes.includes(tag)
    );
    score += matchingThemes.length * 5;
  }

  return Math.max(0, Math.min(100, score));
}

// DB 데이터를 클라이언트 형식으로 변환
function formatUserPreferences(data: any): UserPreferences {
  return {
    id: data.id,
    userId: data.user_id,
    categoryPreferences: data.category_preferences || {},
    priceRangeMin: data.price_range_min,
    priceRangeMax: data.price_range_max,
    preferredThemes: data.preferred_themes || [],
    accessibilityNeeds: data.accessibility_needs || {},
    preferredTimeSlots: data.preferred_time_slots || [],
    groupSizePreference: data.group_size_preference,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}