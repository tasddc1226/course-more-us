import { useState } from 'react';
import Button from '~/components/ui/Button';
import { useUserPreferences } from '~/hooks/useUserPreferences';
import { PreferenceCollector } from './PreferenceCollector';

interface PreferenceProfileProps {
  showCollectorOnMount?: boolean;
}

export function PreferenceProfile({ showCollectorOnMount = false }: PreferenceProfileProps) {
  const { 
    preferences, 
    isLoading, 
    hasPreferences, 
    updatePreferences 
  } = useUserPreferences();
  
  const [showCollector, setShowCollector] = useState(showCollectorOnMount);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPreferences) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            더 나은 추천을 받아보세요
          </h3>
          <p className="text-gray-600 mb-4">
            취향을 설정하면 개인화된 데이트 코스를 추천받을 수 있어요
          </p>
          <Button onClick={() => setShowCollector(true)}>
            취향 설정하기
          </Button>
        </div>
        
        <PreferenceCollector
          isOpen={showCollector}
          onClose={() => setShowCollector(false)}
          onComplete={async (newPreferences) => {
            await updatePreferences(newPreferences);
            setShowCollector(false);
          }}
        />
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    restaurant: '맛집',
    cafe: '카페',
    culture: '문화시설',
    nature: '자연',
    shopping: '쇼핑',
    entertainment: '오락',
    activity: '액티비티',
    nightlife: '유흥',
  };

  const themeNames: Record<string, string> = {
    romantic: '로맨틱',
    activity: '액티비티',
    culture: '문화',
    foodie: '미식',
    nature: '자연',
    urban: '도시',
  };

  const timeSlotNames: Record<string, string> = {
    morning: '오전',
    lunch: '점심',
    afternoon: '오후',
    evening: '저녁',
    night: '밤',
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">내 취향</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCollector(true)}
        >
          수정
        </Button>
      </div>

      <div className="space-y-6">
        {/* 카테고리 선호도 */}
        {Object.keys(preferences?.categoryPreferences || {}).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">선호 카테고리</h4>
            <div className="space-y-2">
              {Object.entries(preferences?.categoryPreferences || {})
                .filter(([_, score]) => score > 0)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 5)
                .map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {categoryNames[category] || category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round(score)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 예산 범위 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">예산 범위</h4>
          <p className="text-sm text-gray-600">
            {preferences?.priceRangeMin?.toLocaleString()}원 - {preferences?.priceRangeMax?.toLocaleString()}원
          </p>
        </div>

        {/* 선호 테마 */}
        {preferences?.preferredThemes && preferences.preferredThemes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">선호 테마</h4>
            <div className="flex flex-wrap gap-2">
              {preferences.preferredThemes.map(theme => (
                <span 
                  key={theme}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {themeNames[theme] || theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 선호 시간대 */}
        {preferences?.preferredTimeSlots && preferences.preferredTimeSlots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">선호 시간대</h4>
            <div className="flex flex-wrap gap-2">
              {preferences.preferredTimeSlots.map(slot => (
                <span 
                  key={slot}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {timeSlotNames[slot] || slot}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 그룹 크기 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">기본 인원수</h4>
          <p className="text-sm text-gray-600">
            {preferences?.groupSizePreference}명
          </p>
        </div>

        {/* 접근성 요구사항 */}
        {preferences?.accessibilityNeeds && 
         Object.values(preferences.accessibilityNeeds).some(Boolean) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">접근성 요구사항</h4>
            <div className="space-y-1">
              {Object.entries(preferences.accessibilityNeeds)
                .filter(([_, enabled]) => enabled)
                .map(([key, _]) => {
                  const labels: Record<string, string> = {
                    wheelchairAccess: '휠체어 접근 가능',
                    parkingRequired: '주차 시설 필요',
                    publicTransportAccess: '대중교통 접근 용이',
                    elevatorAccess: '엘리베이터 필요',
                  };
                  return (
                    <span 
                      key={key}
                      className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs mr-2 mb-1"
                    >
                      {labels[key] || key}
                    </span>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <PreferenceCollector
        isOpen={showCollector}
        onClose={() => setShowCollector(false)}
        onComplete={async (newPreferences) => {
          await updatePreferences(newPreferences);
          setShowCollector(false);
        }}
      />
    </div>
  );
}