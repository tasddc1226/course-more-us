import { useState, useCallback } from 'react';
import type { DateCourse, CoursePlaceInfo } from '~/types/course';
import { Button } from '~/components/ui';
import DraggablePlaceList from './DraggablePlaceList';

interface CourseEditorProps {
  course: DateCourse;
  onSave: (editedCourse: DateCourse) => void;
  onCancel: () => void;
  suggestions?: CoursePlaceInfo[];
}

export default function CourseEditor({ 
  course, 
  onSave, 
  onCancel, 
  suggestions = [] 
}: CourseEditorProps) {
  const [editedCourse, setEditedCourse] = useState<DateCourse>(course);
  const [isSaving, setIsSaving] = useState(false);

  // 장소 순서 변경
  const handleReorder = useCallback((newPlaces: CoursePlaceInfo[]) => {
    setEditedCourse(prev => ({
      ...prev,
      places: newPlaces.map((place, index) => ({
        ...place,
        order: index + 1
      }))
    }));
  }, []);

  // 장소 제거
  const handleRemovePlace = useCallback((placeId: number) => {
    setEditedCourse(prev => ({
      ...prev,
      places: prev.places.filter(p => p.place.id !== placeId)
    }));
  }, []);

  // 시간 할당 변경
  const handleTimeChange = useCallback((placeId: number, newDuration: number) => {
    setEditedCourse(prev => ({
      ...prev,
      places: prev.places.map(p => 
        p.place.id === placeId 
          ? { ...p, suggestedDuration: newDuration }
          : p
      )
    }));
  }, []);

  // 장소 추가
  const handleAddPlace = useCallback((suggestion: CoursePlaceInfo) => {
    const newPlace: CoursePlaceInfo = {
      ...suggestion,
      order: editedCourse.places.length + 1,
      suggestedDuration: suggestion.suggestedDuration || 60
    };
    
    setEditedCourse(prev => ({
      ...prev,
      places: [...prev.places, newPlace]
    }));
  }, [editedCourse.places.length]);

  // 저장 처리
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 총 시간과 거리 재계산
      const totalDuration = editedCourse.places.reduce((sum, p) => sum + p.suggestedDuration, 0);
      const updatedCourse = {
        ...editedCourse,
        totalDuration
      };
      
      onSave(updatedCourse);
    } catch (error) {
      console.error('코스 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">코스 편집</h2>
          <p className="text-sm text-gray-600">
            장소 순서를 드래그하여 변경하고, 시간을 조정할 수 있습니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* 편집 영역 */}
      <div className="space-y-6">
        {/* 드래그 가능한 장소 목록 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">코스 장소들</h3>
          <DraggablePlaceList
            places={editedCourse.places}
            onReorder={handleReorder}
            onRemove={handleRemovePlace}
            onTimeChange={handleTimeChange}
          />
        </div>

        {/* 대체 장소 제안 */}
        {suggestions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">추천 장소</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.slice(0, 6).map((suggestion) => (
                <div 
                  key={suggestion.place.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {suggestion.place.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {suggestion.place.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                          {suggestion.timeSlot.name}
                        </span>
                        {suggestion.place.price_range && (
                          <span className="text-xs text-gray-500">
                            {'💰'.repeat(suggestion.place.price_range)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPlace(suggestion)}
                      className="ml-2"
                    >
                      추가
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 