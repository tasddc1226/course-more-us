import { useState } from 'react';
import { Button } from '~/components/ui';
import BudgetSlider from './BudgetSlider';
import AccessibilityOptions, { type AccessibilityOption } from './AccessibilityOptions';

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  className?: string;
}

export interface AdvancedFilters {
  budget: {
    min: number;
    max: number;
  };
  accessibility: AccessibilityOption[];
  group: {
    size: number;
    hasChildren: boolean;
    hasSeniors: boolean;
  };
  weather: {
    considerWeather: boolean;
    preferIndoor: boolean;
  };
}

const DEFAULT_FILTERS: AdvancedFilters = {
  budget: {
    min: 0,
    max: 100000,
  },
  accessibility: [],
  group: {
    size: 2,
    hasChildren: false,
    hasSeniors: false,
  },
  weather: {
    considerWeather: false,
    preferIndoor: false,
  },
};

export default function AdvancedFilterPanel({
  isOpen,
  onClose,
  onApplyFilters,
  className = ''
}: AdvancedFilterPanelProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<'budget' | 'accessibility' | 'group' | 'weather'>('budget');

  const handleBudgetChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      budget: { min, max }
    }));
  };

  const handleAccessibilityChange = (options: AccessibilityOption[]) => {
    setFilters(prev => ({
      ...prev,
      accessibility: options.filter(opt => opt.enabled)
    }));
  };

  const handleGroupSizeChange = (size: number) => {
    setFilters(prev => ({
      ...prev,
      group: { ...prev.group, size }
    }));
  };

  const handleGroupOptionToggle = (option: 'hasChildren' | 'hasSeniors') => {
    setFilters(prev => ({
      ...prev,
      group: { ...prev.group, [option]: !prev.group[option] }
    }));
  };

  const handleWeatherOptionToggle = (option: 'considerWeather' | 'preferIndoor') => {
    setFilters(prev => ({
      ...prev,
      weather: { ...prev.weather, [option]: !prev.weather[option] }
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">고급 필터</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'budget', label: '예산', icon: '💰' },
            { key: 'accessibility', label: '접근성', icon: '♿' },
            { key: 'group', label: '그룹', icon: '👥' },
            { key: 'weather', label: '날씨', icon: '🌤️' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors
                ${activeTab === tab.key
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'budget' && (
            <BudgetSlider
              minBudget={filters.budget.min}
              maxBudget={filters.budget.max}
              onBudgetChange={handleBudgetChange}
            />
          )}

          {activeTab === 'accessibility' && (
            <AccessibilityOptions
              options={[
                {
                  id: 'wheelchair',
                  label: '휠체어 접근 가능',
                  description: '휠체어 사용자가 이용할 수 있는 시설',
                  icon: '♿',
                  enabled: filters.accessibility.some(opt => opt.id === 'wheelchair'),
                },
                {
                  id: 'parking',
                  label: '주차 시설',
                  description: '자동차 주차 공간 제공',
                  icon: '🅿️',
                  enabled: filters.accessibility.some(opt => opt.id === 'parking'),
                },
                {
                  id: 'public_transport',
                  label: '대중교통 접근',
                  description: '지하철, 버스 등 대중교통 이용 가능',
                  icon: '🚇',
                  enabled: filters.accessibility.some(opt => opt.id === 'public_transport'),
                },
                {
                  id: 'elevator',
                  label: '엘리베이터',
                  description: '엘리베이터 또는 승강기 시설',
                  icon: '🛗',
                  enabled: filters.accessibility.some(opt => opt.id === 'elevator'),
                },
              ]}
              onOptionsChange={handleAccessibilityChange}
            />
          )}

          {activeTab === 'group' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">그룹 설정</h3>
              
              {/* 인원수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  인원수
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((size) => (
                    <Button
                      key={size}
                      variant={filters.group.size === size ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleGroupSizeChange(size)}
                    >
                      {size}명
                    </Button>
                  ))}
                </div>
              </div>

              {/* 특별 요구사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  특별 요구사항
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filters.group.hasChildren}
                      onChange={() => handleGroupOptionToggle('hasChildren')}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">아동 동반</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filters.group.hasSeniors}
                      onChange={() => handleGroupOptionToggle('hasSeniors')}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">노약자 동반</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weather' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">날씨 고려</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.weather.considerWeather}
                    onChange={() => handleWeatherOptionToggle('considerWeather')}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">날씨 고려</span>
                    <p className="text-xs text-gray-500">현재 날씨에 맞는 장소 추천</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.weather.preferIndoor}
                    onChange={() => handleWeatherOptionToggle('preferIndoor')}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">실내 장소 선호</span>
                    <p className="text-xs text-gray-500">우천시 실내 장소 우선 추천</p>
                  </div>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500 text-lg">⚠️</span>
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">날씨 기능 안내</p>
                    <p>
                      날씨 API 연동이 필요합니다. 현재는 기본 설정만 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleReset}
          >
            초기화
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
            >
              필터 적용
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 