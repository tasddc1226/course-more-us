import { useState, useEffect, useCallback } from 'react';

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

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/preferences/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/preferences/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      return data.preferences;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating preferences:', err);
      throw err;
    }
  }, []);

  // 카테고리 선호도 업데이트
  const updateCategoryPreference = useCallback(async (category: string, score: number) => {
    if (!preferences) return;

    const newCategoryPreferences = {
      ...preferences.categoryPreferences,
      [category]: Math.max(0, Math.min(100, score)),
    };

    return updatePreferences({ categoryPreferences: newCategoryPreferences });
  }, [preferences, updatePreferences]);

  // 예산 범위 업데이트
  const updateBudgetRange = useCallback(async (min: number, max: number) => {
    return updatePreferences({
      priceRangeMin: Math.max(0, min),
      priceRangeMax: Math.max(min, max),
    });
  }, [updatePreferences]);

  // 테마 토글
  const toggleTheme = useCallback(async (theme: string) => {
    if (!preferences) return;

    const currentThemes = preferences.preferredThemes;
    const newThemes = currentThemes.includes(theme)
      ? currentThemes.filter(t => t !== theme)
      : [...currentThemes, theme];

    return updatePreferences({ preferredThemes: newThemes });
  }, [preferences, updatePreferences]);

  // 시간대 토글
  const toggleTimeSlot = useCallback(async (timeSlot: string) => {
    if (!preferences) return;

    const currentSlots = preferences.preferredTimeSlots;
    const newSlots = currentSlots.includes(timeSlot)
      ? currentSlots.filter(s => s !== timeSlot)
      : [...currentSlots, timeSlot];

    return updatePreferences({ preferredTimeSlots: newSlots });
  }, [preferences, updatePreferences]);

  // 접근성 요구사항 토글
  const toggleAccessibilityNeed = useCallback(async (need: string) => {
    if (!preferences) return;

    const newAccessibilityNeeds = {
      ...preferences.accessibilityNeeds,
      [need]: !preferences.accessibilityNeeds[need],
    };

    return updatePreferences({ accessibilityNeeds: newAccessibilityNeeds });
  }, [preferences, updatePreferences]);

  // 그룹 크기 업데이트
  const updateGroupSize = useCallback(async (size: number) => {
    return updatePreferences({
      groupSizePreference: Math.max(1, Math.min(10, size)),
    });
  }, [updatePreferences]);

  // 선호도가 설정되었는지 확인
  const hasPreferences = preferences && (
    Object.keys(preferences.categoryPreferences).length > 0 ||
    preferences.preferredThemes.length > 0 ||
    preferences.preferredTimeSlots.length > 0
  );

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    hasPreferences,
    fetchPreferences,
    updatePreferences,
    updateCategoryPreference,
    updateBudgetRange,
    toggleTheme,
    toggleTimeSlot,
    toggleAccessibilityNeed,
    updateGroupSize,
  };
}