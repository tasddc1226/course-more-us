import { useState, useEffect } from 'react';
import type { DateCourse, CoursePlaceInfo } from '~/types/course';
import type { AdvancedFilters } from '~/components/filters';
import { Button } from '~/components/ui';
import { CourseEditor } from './';
import { AdvancedFilterPanel } from '~/components/filters';

interface IntegratedCourseEditorProps {
  course: DateCourse;
  onSave: (editedCourse: DateCourse) => void;
  onCancel: () => void;
  onFiltersChange?: (filters: AdvancedFilters) => void;
  className?: string;
}

export default function IntegratedCourseEditor({
  course,
  onSave,
  onCancel,
  onFiltersChange,
  className = ''
}: IntegratedCourseEditorProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters | null>(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState<CoursePlaceInfo[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // 필터 적용 시 제안 장소 업데이트
  useEffect(() => {
    if (appliedFilters) {
      updateFilteredSuggestions(appliedFilters);
    }
  }, [appliedFilters]);

  const updateFilteredSuggestions = async (filters: AdvancedFilters) => {
    setIsLoadingSuggestions(true);
    try {
      // 실제로는 서버에서 필터링된 장소를 가져와야 함
      // 현재는 기본 제안 목록을 필터링하여 시뮬레이션
      const mockSuggestions: CoursePlaceInfo[] = [
        {
          place: {
            id: 1,
            name: '아늑한 카페',
            description: '조용하고 분위기 좋은 카페',
            address: '서울시 강남구',
            latitude: 37.5665,
            longitude: 126.9780,
            price_range: 2,
            rating: 4.5,
            is_partnership: true,
            category_id: 1,
            region_id: 1,
            tags: ['카페', '조용한', '분위기좋은'],
            accessibility_features: ['wheelchair', 'parking'],
            is_active: true,
            source: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          timeSlot: {
            id: 1,
            name: '오후',
            slug: 'afternoon',
            start_time: '14:00',
            end_time: '18:00',
            description: '오후 시간대',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          order: 1,
          suggestedDuration: 60,
        },
        {
          place: {
            id: 2,
            name: '전시관',
            description: '현대 미술 전시관',
            address: '서울시 종로구',
            latitude: 37.5665,
            longitude: 126.9780,
            price_range: 3,
            rating: 4.2,
            is_partnership: false,
            category_id: 2,
            region_id: 1,
            tags: ['전시', '문화', '실내'],
            accessibility_features: ['wheelchair', 'elevator'],
            is_active: true,
            source: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          timeSlot: {
            id: 2,
            name: '저녁',
            slug: 'evening',
            start_time: '18:00',
            end_time: '22:00',
            description: '저녁 시간대',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          order: 2,
          suggestedDuration: 90,
        },
      ];

      // 필터 적용
      let filtered = mockSuggestions;

      // 예산 필터
      if (filters.budget.min > 0 || filters.budget.max < 500000) {
        filtered = filtered.filter(suggestion => {
          const estimatedCost = suggestion.place.price_range * 15000;
          return estimatedCost >= filters.budget.min && estimatedCost <= filters.budget.max;
        });
      }

      // 접근성 필터
      if (filters.accessibility.length > 0) {
        filtered = filtered.filter(suggestion => {
          return filters.accessibility.some(opt => 
            suggestion.place.accessibility_features?.includes(opt.id)
          );
        });
      }

      // 날씨 필터 (실내 선호)
      if (filters.weather.preferIndoor) {
        filtered = filtered.filter(suggestion => {
          const indoorTags = ['실내', '카페', '전시', '영화관'];
          return suggestion.place.tags?.some(tag => 
            indoorTags.some(indoor => tag.includes(indoor))
          );
        });
      }

      setFilteredSuggestions(filtered);
    } catch (error) {
      console.error('필터링된 제안 로드 실패:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleFiltersApply = (filters: AdvancedFilters) => {
    setAppliedFilters(filters);
    setIsFilterOpen(false);
    onFiltersChange?.(filters);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 필터 상태 표시 */}
      {appliedFilters && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-purple-800">적용된 필터</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
            >
              필터 수정
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* 예산 필터 */}
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              예산: {appliedFilters.budget.min.toLocaleString()}원 - {appliedFilters.budget.max.toLocaleString()}원
            </span>
            
            {/* 접근성 필터 */}
            {appliedFilters.accessibility.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                접근성: {appliedFilters.accessibility.length}개
              </span>
            )}
            
            {/* 그룹 필터 */}
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              인원: {appliedFilters.group.size}명
            </span>
            
            {appliedFilters.group.hasChildren && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                아동 동반
              </span>
            )}
            
            {appliedFilters.group.hasSeniors && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                노약자 동반
              </span>
            )}
            
            {/* 날씨 필터 */}
            {appliedFilters.weather.preferIndoor && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                실내 선호
              </span>
            )}
          </div>
        </div>
      )}

      {/* 코스 편집기 */}
      <CourseEditor
        course={course}
        onSave={onSave}
        onCancel={onCancel}
        suggestions={filteredSuggestions}
      />

      {/* 필터 열기 버튼 */}
      {!appliedFilters && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(true)}
            className="w-full"
          >
            🔍 고급 필터로 맞춤 제안 받기
          </Button>
        </div>
      )}

      {/* 고급 필터 패널 */}
      <AdvancedFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleFiltersApply}
      />

      {/* 로딩 상태 */}
      {isLoadingSuggestions && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">필터링된 장소를 찾고 있습니다...</p>
        </div>
      )}
    </div>
  );
} 