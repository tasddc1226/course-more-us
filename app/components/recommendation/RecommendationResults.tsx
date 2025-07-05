import type { RecommendationResponse } from "~/lib/recommendation/types";
import type { TimeSlot, PlaceWithTimeSlots } from "~/types/recommendation";
import type { UserFeedback } from "~/lib/feedback.server";
import { groupPlacesByTimeSlot } from "~/utils/recommendation";
import { AdminMetrics } from "./AdminMetrics";
import { PlaceCard } from "./PlaceCard";

interface RecommendationResultsProps {
  recommendations: RecommendationResponse;
  timeSlots: TimeSlot[];
  isAdmin?: boolean;
  userFeedbacks?: Record<number, UserFeedback[]>;
  userFavorites?: Record<number, boolean>;
}

export function RecommendationResults({ 
  recommendations, 
  timeSlots,
  isAdmin = false,
  userFeedbacks = {},
  userFavorites = {}
}: RecommendationResultsProps) {
  const places = recommendations.places as PlaceWithTimeSlots[];
  const selectedTimeSlotIds = recommendations.metadata.requestInfo.timeSlotIds;
  
  // 시간대별로 장소 그룹화
  const timeSlotGroups = groupPlacesByTimeSlot(places, timeSlots, selectedTimeSlotIds);
  
  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">😔</div>
        <p className="text-gray-600">
          선택하신 조건에 맞는 데이트 코스가 없습니다.<br />
          다른 지역이나 시간대를 선택해보세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 관리자용 메트릭 */}
      {isAdmin && (
        <AdminMetrics metadata={recommendations.metadata} />
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          ✨ 추천 데이트 코스 ✨
        </h3>
        <p className="text-sm text-gray-600">
          총 {places.length}개의 장소를 추천받았습니다
        </p>
        {!isAdmin && (
          <div className="text-xs text-gray-500 mt-1">
            실행 시간: {recommendations.metadata.executionTime}ms
          </div>
        )}
      </div>

      {timeSlotGroups.map((group) => (
        <div key={group.timeSlot.id} className="mb-8">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-purple-800 mb-1">
              {group.timeSlot.name}
            </h4>
            <p className="text-sm text-gray-600">
              {group.timeSlot.start_time} - {group.timeSlot.end_time} • {group.places.length}개 장소
            </p>
          </div>
          
          <div className="space-y-4">
            {group.places.map((place, index) => (
              <PlaceCard 
                key={`${place.id}-${group.timeSlot.id}`} 
                place={place} 
                rank={index + 1}
                userFeedbacks={userFeedbacks[place.id] || []}
                isFavorite={userFavorites[place.id] || false}
              />
            ))}
          </div>
        </div>
      ))}

      {timeSlotGroups.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-4">🤔</div>
          <p className="text-gray-600">
            선택하신 시간대에 맞는 장소를 찾을 수 없습니다.<br />
            다른 시간대를 선택해보세요.
          </p>
        </div>
      )}
    </div>
  );
} 