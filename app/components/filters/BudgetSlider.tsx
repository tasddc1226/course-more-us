import { useState, useEffect } from 'react';
import { Button } from '~/components/ui';

interface BudgetSliderProps {
  minBudget: number;
  maxBudget: number;
  onBudgetChange: (min: number, max: number) => void;
  className?: string;
}

const BUDGET_PRESETS = [
  { label: '2만원 이하', min: 0, max: 20000 },
  { label: '2-5만원', min: 20000, max: 50000 },
  { label: '5-10만원', min: 50000, max: 100000 },
  { label: '10만원 이상', min: 100000, max: 500000 },
];

export default function BudgetSlider({
  minBudget,
  maxBudget,
  onBudgetChange,
  className = ''
}: BudgetSliderProps) {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalMin(minBudget);
    setLocalMax(maxBudget);
  }, [minBudget, maxBudget]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax - 10000);
    setLocalMin(newMin);
    if (!isDragging) {
      onBudgetChange(newMin, localMax);
    }
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin + 10000);
    setLocalMax(newMax);
    if (!isDragging) {
      onBudgetChange(localMin, newMax);
    }
  };

  const handlePresetClick = (preset: typeof BUDGET_PRESETS[0]) => {
    setLocalMin(preset.min);
    setLocalMax(preset.max);
    onBudgetChange(preset.min, preset.max);
  };

  const formatBudget = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  const getBudgetRange = () => {
    if (localMin === 0 && localMax >= 500000) {
      return '제한 없음';
    }
    if (localMin === localMax) {
      return formatBudget(localMin);
    }
    return `${formatBudget(localMin)} - ${formatBudget(localMax)}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">예산 범위</h3>
        <div className="text-sm text-gray-600">
          총 예산: <span className="font-medium text-purple-600">{getBudgetRange()}</span>
        </div>
      </div>

      {/* 프리셋 버튼들 */}
      <div className="flex flex-wrap gap-2">
        {BUDGET_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className={`text-xs ${
              localMin === preset.min && localMax === preset.max
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : ''
            }`}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* 슬라이더 */}
      <div className="space-y-6">
        {/* 최소값 슬라이더 */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>최소 예산</span>
            <span className="font-medium">{formatBudget(localMin)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500000"
            step="5000"
            value={localMin}
            onChange={(e) => handleMinChange(parseInt(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => {
              setIsDragging(false);
              onBudgetChange(localMin, localMax);
            }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => {
              setIsDragging(false);
              onBudgetChange(localMin, localMax);
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* 최대값 슬라이더 */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>최대 예산</span>
            <span className="font-medium">{formatBudget(localMax)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500000"
            step="5000"
            value={localMax}
            onChange={(e) => handleMaxChange(parseInt(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => {
              setIsDragging(false);
              onBudgetChange(localMin, localMax);
            }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => {
              setIsDragging(false);
              onBudgetChange(localMin, localMax);
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* 예산 범위 시각화 */}
      <div className="bg-gray-100 rounded-lg p-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>0원</span>
          <span>50만원</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
            style={{
              left: `${(localMin / 500000) * 100}%`,
              width: `${((localMax - localMin) / 500000) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>최소: {formatBudget(localMin)}</span>
          <span>최대: {formatBudget(localMax)}</span>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
} 