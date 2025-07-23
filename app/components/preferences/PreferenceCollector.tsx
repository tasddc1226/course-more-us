import { useState } from 'react';
import Button from '~/components/ui/Button';
import Modal from '~/components/ui/Modal';

interface PreferenceCollectorProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preferences: UserPreferencesData) => void;
}

interface UserPreferencesData {
  categoryPreferences: Record<string, number>;
  priceRangeMin: number;
  priceRangeMax: number;
  preferredThemes: string[];
  accessibilityNeeds: Record<string, boolean>;
  preferredTimeSlots: string[];
  groupSizePreference: number;
}

const categories = [
  { id: 'restaurant', name: '맛집', icon: '🍽️' },
  { id: 'cafe', name: '카페', icon: '☕' },
  { id: 'culture', name: '문화시설', icon: '🎨' },
  { id: 'nature', name: '자연', icon: '🌿' },
  { id: 'shopping', name: '쇼핑', icon: '🛍️' },
  { id: 'entertainment', name: '오락', icon: '🎮' },
  { id: 'activity', name: '액티비티', icon: '🏃' },
  { id: 'nightlife', name: '유흥', icon: '🌃' },
];

const themes = [
  { id: 'romantic', name: '로맨틱' },
  { id: 'activity', name: '액티비티' },
  { id: 'culture', name: '문화' },
  { id: 'foodie', name: '미식' },
  { id: 'nature', name: '자연' },
  { id: 'urban', name: '도시' },
];

const timeSlots = [
  { id: 'morning', name: '오전 (9-12시)' },
  { id: 'lunch', name: '점심 (12-14시)' },
  { id: 'afternoon', name: '오후 (14-18시)' },
  { id: 'evening', name: '저녁 (18-21시)' },
  { id: 'night', name: '밤 (21시 이후)' },
];

export function PreferenceCollector({ isOpen, onClose, onComplete }: PreferenceCollectorProps) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    categoryPreferences: {},
    priceRangeMin: 10000,
    priceRangeMax: 80000,
    preferredThemes: [],
    accessibilityNeeds: {},
    preferredTimeSlots: [],
    groupSizePreference: 2,
  });

  const handleCategoryRating = (categoryId: string, rating: number) => {
    setPreferences(prev => ({
      ...prev,
      categoryPreferences: {
        ...prev.categoryPreferences,
        [categoryId]: rating * 20, // 1-5 점수를 0-100으로 변환
      },
    }));
  };

  const handleThemeToggle = (themeId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredThemes: prev.preferredThemes.includes(themeId)
        ? prev.preferredThemes.filter(t => t !== themeId)
        : [...prev.preferredThemes, themeId],
    }));
  };

  const handleTimeSlotToggle = (slotId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.includes(slotId)
        ? prev.preferredTimeSlots.filter(t => t !== slotId)
        : [...prev.preferredTimeSlots, slotId],
    }));
  };

  const handleAccessibilityToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      accessibilityNeeds: {
        ...prev.accessibilityNeeds,
        [key]: !prev.accessibilityNeeds[key],
      },
    }));
  };

  const handleComplete = () => {
    onComplete(preferences);
    onClose();
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">취향 설정</h2>
            <span className="text-sm text-gray-500">{step}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">어떤 장소를 선호하시나요?</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map(category => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => handleCategoryRating(category.id, rating)}
                        className={`w-8 h-8 rounded ${
                          (preferences.categoryPreferences[category.id] || 0) >= rating * 20
                            ? 'bg-yellow-400 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">예산 범위를 설정해주세요</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">최소 예산</label>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={preferences.priceRangeMin}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    priceRangeMin: parseInt(e.target.value),
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">
                  {preferences.priceRangeMin.toLocaleString()}원
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">최대 예산</label>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="10000"
                  value={preferences.priceRangeMax}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    priceRangeMax: parseInt(e.target.value),
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">
                  {preferences.priceRangeMax.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">선호하는 테마를 선택해주세요</h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeToggle(theme.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    preferences.preferredThemes.includes(theme.id)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">선호하는 시간대를 선택해주세요</h3>
            <div className="space-y-3">
              {timeSlots.map(slot => (
                <label key={slot.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.preferredTimeSlots.includes(slot.id)}
                    onChange={() => handleTimeSlotToggle(slot.id)}
                    className="rounded"
                  />
                  <span>{slot.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">추가 설정</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">기본 인원수</label>
                <select
                  value={preferences.groupSizePreference}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    groupSizePreference: parseInt(e.target.value),
                  }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value={2}>2명 (커플)</option>
                  <option value={3}>3명</option>
                  <option value={4}>4명</option>
                  <option value={5}>5명 이상</option>
                </select>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">접근성 요구사항</h4>
                <div className="space-y-2">
                  {[
                    { key: 'wheelchairAccess', label: '휠체어 접근 가능' },
                    { key: 'parkingRequired', label: '주차 시설 필요' },
                    { key: 'publicTransportAccess', label: '대중교통 접근 용이' },
                    { key: 'elevatorAccess', label: '엘리베이터 필요' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!preferences.accessibilityNeeds[item.key]}
                        onChange={() => handleAccessibilityToggle(item.key)}
                        className="rounded"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            이전
          </Button>
          
          {step < 5 ? (
            <Button onClick={nextStep}>
              다음
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              완료
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}