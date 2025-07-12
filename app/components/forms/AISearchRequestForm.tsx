import { useState } from 'react';
import FormField from '~/components/ui/FormField';
import Textarea from '~/components/ui/Textarea';
import Select from '~/components/ui/Select';
import Button from '~/components/ui/Button';
import { INTEREST_TAGS, BUDGET_RANGES } from '~/types/perplexity';

export interface AISearchFormData {
  userRequest: string;
  interests: string[];
  budgetRange: { min: number; max: number };
  includeTrends: boolean;
  includeReviews: boolean;
}

interface AISearchRequestFormProps {
  onSubmit: (data: AISearchFormData) => void;
  isLoading?: boolean;
  className?: string;
}

export function AISearchRequestForm({ 
  onSubmit, 
  isLoading = false,
  className = '' 
}: AISearchRequestFormProps) {
  const [userRequest, setUserRequest] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number }>(BUDGET_RANGES[1].value);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!userRequest.trim()) return;

    onSubmit({
      userRequest: userRequest.trim(),
      interests: selectedInterests,
      budgetRange: selectedBudget,
      includeTrends,
      includeReviews
    });
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const hasValidInput = userRequest.trim().length >= 10;

  return (
    <div className={`ai-search-form ${className}`}>
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-gray-800">AI 맞춤 데이트 코스</h3>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            NEW
          </span>
        </div>
        <p className="text-sm text-gray-600">
          원하는 데이트를 자연어로 설명해주세요. 실시간 검색으로 맞춤 코스를 추천해드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 자연어 요청 입력 */}
        <FormField 
          label="어떤 데이트를 원하시나요?" 
          required
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              예: 조용하고 아늑한 곳에서 대화 중심의 데이트를 하고 싶어요.
            </p>
            <Textarea
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              placeholder="원하는 데이트 스타일, 분위기, 특별한 요청 등을 자유롭게 설명해주세요.
예시:
• 조용한 카페에서 책 얘기하며 여유로운 데이트
• 액티비티 중심의 활동적인 데이트 
• 최근 핫한 맛집들을 포함한 미식 데이트
• 사진 찍기 좋은 감성적인 장소들로 구성된 데이트"
              rows={4}
              maxLength={500}
              className="resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                최소 10자 이상 입력해주세요
              </span>
              <span className={`text-xs ${userRequest.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                {userRequest.length}/500
              </span>
            </div>
          </div>
        </FormField>

        {/* 관심사 태그 선택 */}
        <FormField 
          label="관심사 (복수 선택 가능)"
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              선택한 관심사를 바탕으로 더 정확한 추천을 제공합니다.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {INTEREST_TAGS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  disabled={isLoading}
                  className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${selectedInterests.includes(interest)
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {interest}
                </button>
              ))}
            </div>
            {selectedInterests.length > 0 && (
              <div className="text-xs text-purple-600">
                선택된 관심사: {selectedInterests.join(', ')}
              </div>
            )}
          </div>
        </FormField>

        {/* 예산 범위 */}
        <FormField 
          label="예산 범위"
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              1인 기준 예상 예산을 선택해주세요.
            </p>
            <Select
              value={BUDGET_RANGES.findIndex(b => 
                b.value.min === selectedBudget.min && b.value.max === selectedBudget.max
              )}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const selectedIndex = parseInt(e.target.value);
                if (selectedIndex >= 0 && selectedIndex < BUDGET_RANGES.length) {
                  setSelectedBudget(BUDGET_RANGES[selectedIndex].value);
                }
              }}
              disabled={isLoading}
            >
              {BUDGET_RANGES.map((budget, index) => (
                <option key={index} value={index}>
                  {budget.label}
                </option>
              ))}
            </Select>
          </div>
        </FormField>

        {/* 실시간 정보 옵션 */}
        <FormField 
          label="실시간 정보 활용"
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              최신 트렌드와 리뷰를 반영하여 더 정확한 추천을 제공합니다.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeTrends"
                  checked={includeTrends}
                  onChange={(e) => setIncludeTrends(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="includeTrends" className="cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">최신 트렌드 반영</span>
                  <p className="text-xs text-gray-500">현재 인기 있는 장소와 핫플레이스 포함</p>
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeReviews"
                  checked={includeReviews}
                  onChange={(e) => setIncludeReviews(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="includeReviews" className="cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">실시간 리뷰 기반 추천</span>
                  <p className="text-xs text-gray-500">최신 리뷰와 평점이 좋은 장소 우선 추천</p>
                </label>
              </div>
            </div>
          </div>
        </FormField>

        {/* 제출 버튼 */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!hasValidInput || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI가 맞춤 코스를 생성하는 중...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🔍</span>
                <span>AI 맞춤 데이트 코스 추천받기</span>
              </div>
            )}
          </Button>
          
          {!hasValidInput && userRequest.length > 0 && (
            <p className="mt-2 text-xs text-amber-600 text-center">
              더 정확한 추천을 위해 요청사항을 조금 더 자세히 작성해주세요.
            </p>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>💡 구체적으로 설명할수록 더 정확한 맞춤 추천을 받을 수 있어요</p>
          <p>🔍 실시간 검색으로 최신 정보를 반영한 코스를 추천해드립니다</p>
        </div>
      </form>
    </div>
  );
} 