import { useState } from 'react';
import { Button } from '~/components/ui';

interface AccessibilityOptionsProps {
  options: AccessibilityOption[];
  onOptionsChange: (options: AccessibilityOption[]) => void;
  className?: string;
}

export interface AccessibilityOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_ACCESSIBILITY_OPTIONS: AccessibilityOption[] = [
  {
    id: 'wheelchair',
    label: '휠체어 접근 가능',
    description: '휠체어 사용자가 이용할 수 있는 시설',
    icon: '♿',
    enabled: false,
  },
  {
    id: 'parking',
    label: '주차 시설',
    description: '자동차 주차 공간 제공',
    icon: '🅿️',
    enabled: false,
  },
  {
    id: 'public_transport',
    label: '대중교통 접근',
    description: '지하철, 버스 등 대중교통 이용 가능',
    icon: '🚇',
    enabled: false,
  },
  {
    id: 'elevator',
    label: '엘리베이터',
    description: '엘리베이터 또는 승강기 시설',
    icon: '🛗',
    enabled: false,
  },
  {
    id: 'ramp',
    label: '경사로',
    description: '휠체어용 경사로 또는 슬로프',
    icon: '🛤️',
    enabled: false,
  },
  {
    id: 'accessible_bathroom',
    label: '장애인 화장실',
    description: '장애인 전용 화장실 시설',
    icon: '🚻',
    enabled: false,
  },
];

export default function AccessibilityOptions({
  options = DEFAULT_ACCESSIBILITY_OPTIONS,
  onOptionsChange,
  className = ''
}: AccessibilityOptionsProps) {
  const [localOptions, setLocalOptions] = useState<AccessibilityOption[]>(options);

  const handleOptionToggle = (optionId: string) => {
    const updatedOptions = localOptions.map(option =>
      option.id === optionId
        ? { ...option, enabled: !option.enabled }
        : option
    );
    setLocalOptions(updatedOptions);
    onOptionsChange(updatedOptions);
  };

  const handleSelectAll = () => {
    const updatedOptions = localOptions.map(option => ({ ...option, enabled: true }));
    setLocalOptions(updatedOptions);
    onOptionsChange(updatedOptions);
  };

  const handleClearAll = () => {
    const updatedOptions = localOptions.map(option => ({ ...option, enabled: false }));
    setLocalOptions(updatedOptions);
    onOptionsChange(updatedOptions);
  };

  const enabledCount = localOptions.filter(option => option.enabled).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">접근성 옵션</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            전체 선택
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            전체 해제
          </Button>
        </div>
      </div>

      {/* 선택된 옵션 개수 */}
      <div className="text-sm text-gray-600">
        {enabledCount > 0 ? (
          <span className="text-purple-600 font-medium">
            {enabledCount}개 옵션 선택됨
          </span>
        ) : (
          <span>접근성 옵션을 선택해주세요</span>
        )}
      </div>

      {/* 옵션 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {localOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`
              w-full text-left border-2 rounded-lg p-4 transition-all
              ${option.enabled
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
            onClick={() => handleOptionToggle(option.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOptionToggle(option.id);
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* 체크박스 */}
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={option.enabled}
                  onChange={() => handleOptionToggle(option.id)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>

              {/* 아이콘 */}
              <div className="flex-shrink-0 text-2xl">
                {option.icon}
              </div>

              {/* 내용 */}
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  {option.label}
                </h4>
                <p className="text-sm text-gray-600">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 text-lg">💡</span>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">접근성 옵션 안내</p>
            <p>
              선택한 접근성 옵션에 맞는 장소들만 추천됩니다. 
              여러 옵션을 선택하면 모든 조건을 만족하는 장소를 찾습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 