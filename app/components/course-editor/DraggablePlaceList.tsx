import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import type { CoursePlaceInfo } from '~/types/course';
import { Button } from '~/components/ui';

interface DraggablePlaceListProps {
  places: CoursePlaceInfo[];
  onReorder: (newPlaces: CoursePlaceInfo[]) => void;
  onRemove: (placeId: number) => void;
  onTimeChange: (placeId: number, duration: number) => void;
}

export default function DraggablePlaceList({
  places,
  onReorder,
  onRemove,
  onTimeChange
}: DraggablePlaceListProps) {
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(places);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const handleTimeEdit = (placeId: number) => {
    setEditingTimeId(editingTimeId === placeId ? null : placeId);
  };

  const handleTimeSave = (placeId: number, duration: number) => {
    onTimeChange(placeId, duration);
    setEditingTimeId(null);
  };

  if (places.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>코스에 장소가 없습니다</p>
        <p className="text-sm">아래 추천 장소에서 추가해보세요</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="places">
        {(provided: DroppableProvided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {places.map((placeInfo, index) => (
              <Draggable
                key={placeInfo.place.id}
                draggableId={placeInfo.place.id.toString()}
                index={index}
              >
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                      bg-white border-2 rounded-lg p-4 transition-all
                      ${snapshot.isDragging 
                        ? 'border-purple-400 shadow-lg rotate-2' 
                        : 'border-gray-200 hover:border-purple-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* 드래그 핸들 */}
                      <div
                        {...provided.dragHandleProps}
                        className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                        </svg>
                      </div>

                      {/* 순서 번호 */}
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>

                      {/* 장소 정보 */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {placeInfo.place.name}
                            </h4>
                            {placeInfo.place.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {placeInfo.place.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                {placeInfo.timeSlot.name}
                              </span>
                              {placeInfo.place.price_range && (
                                <span className="text-xs text-gray-500">
                                  {'💰'.repeat(placeInfo.place.price_range)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 액션 버튼들 */}
                          <div className="flex items-center gap-2">
                            {/* 시간 편집 */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTimeEdit(placeInfo.place.id)}
                            >
                              {editingTimeId === placeInfo.place.id ? '취소' : '시간'}
                            </Button>

                            {/* 제거 */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRemove(placeInfo.place.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              제거
                            </Button>
                          </div>
                        </div>

                        {/* 시간 편집 UI */}
                        {editingTimeId === placeInfo.place.id && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <label htmlFor={`duration-${placeInfo.place.id}`} className="text-sm font-medium text-gray-700">
                                체류 시간:
                              </label>
                              <select
                                id={`duration-${placeInfo.place.id}`}
                                value={placeInfo.suggestedDuration}
                                onChange={(e) => handleTimeSave(placeInfo.place.id, parseInt(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value={30}>30분</option>
                                <option value={60}>1시간</option>
                                <option value={90}>1시간 30분</option>
                                <option value={120}>2시간</option>
                                <option value={180}>3시간</option>
                              </select>
                              <span className="text-sm text-gray-500">
                                현재: {placeInfo.suggestedDuration}분
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
} 