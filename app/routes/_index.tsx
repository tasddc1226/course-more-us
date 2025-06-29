import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form, useNavigation, useFetcher } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";
import { getRegions, getTimeSlots } from "~/lib/data.server";
import { getAdvancedRecommendations } from "~/lib/recommendation.server";

import { getUserFeedbacksForPlaces, toggleFeedback, type FeedbackType, type UserFeedback } from "~/lib/feedback.server";
import { getUserFavoritesForPlaces, toggleFavorite } from "~/lib/favorites.server";

import { Button, Calendar, triggerCelebration } from "~/components/ui";
import { ROUTES } from "~/constants/routes";
import type { RecommendationResponse, RecommendedPlace } from "~/lib/recommendation/types";
import type { Tables } from "~/types/database.types";
import { useState, useEffect, useRef } from "react";

// 추천 결과 UI를 위한 타입 정의
type TimeSlot = Tables<'time_slots'>;
type PlaceWithTimeSlots = RecommendedPlace & {
  place_time_slots?: Array<{
    time_slot_id: number;
    priority?: number;
  }>;
  place_images?: Array<{
    image_url: string;
    alt_text?: string;
  }>;
  categories?: {
    name: string;
    icon?: string;
  };
  tags?: string[];
  description?: string;
  price_range?: number;
};

type TimeSlotGroup = {
  timeSlot: TimeSlot;
  places: PlaceWithTimeSlots[];
};

// 시간대별로 장소를 그룹화하는 헬퍼 함수
function groupPlacesByTimeSlot(
  places: PlaceWithTimeSlots[], 
  timeSlots: TimeSlot[],
  selectedTimeSlotIds: number[]
): TimeSlotGroup[] {
  const groups: TimeSlotGroup[] = [];
  
  // 선택된 시간대만 순회
  const selectedTimeSlots = timeSlots.filter(ts => selectedTimeSlotIds.includes(ts.id));
  
  for (const timeSlot of selectedTimeSlots) {
    const placesForTimeSlot = places.filter(place => 
      place.place_time_slots?.some(pts => pts.time_slot_id === timeSlot.id)
    );
    
    // 해당 시간대에 맞는 장소가 있으면 그룹에 추가
    if (placesForTimeSlot.length > 0) {
      groups.push({
        timeSlot,
        places: placesForTimeSlot.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
      });
    }
  }
  
  return groups;
}

// 관리자용 메트릭 컴포넌트
function AdminMetrics({ 
  metadata 
}: { 
  metadata: RecommendationResponse['metadata'];
}) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-orange-600">🔧</span>
        <h4 className="font-semibold text-orange-800">관리자 전용 메트릭</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">총 후보</div>
          <div className="text-lg font-bold text-orange-900">{metadata.totalCandidates}개</div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">실행 시간</div>
          <div className="text-lg font-bold text-orange-900">{metadata.executionTime}ms</div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">위치 그룹화</div>
          <div className="text-lg font-bold text-orange-900">{metadata.filteringSteps.afterLocationGrouping}개</div>
          <div className="text-xs text-orange-600">
            -{metadata.totalCandidates - metadata.filteringSteps.afterLocationGrouping}개 병합
          </div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-orange-700 font-medium mb-1">다양성 필터</div>
          <div className="text-lg font-bold text-orange-900">{metadata.filteringSteps.afterDiversityFilter}개</div>
          <div className="text-xs text-orange-600">
            -{metadata.filteringSteps.afterLocationGrouping - metadata.filteringSteps.afterDiversityFilter}개 제외
          </div>
        </div>
      </div>
      
      <div className="mt-3 p-3 bg-white/60 rounded-lg">
        <div className="text-orange-700 font-medium mb-2">필터링 단계별 변화</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
            초기: {metadata.filteringSteps.initial}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
            그룹화: {metadata.filteringSteps.afterLocationGrouping}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
            다양성: {metadata.filteringSteps.afterDiversityFilter}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
            최종: {metadata.filteringSteps.final}
          </span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-orange-600">
        필터링 효율: {((metadata.filteringSteps.final / metadata.totalCandidates) * 100).toFixed(1)}% 
        (총 {metadata.totalCandidates}개 중 {metadata.filteringSteps.final}개 선별)
      </div>
    </div>
  );
}

// 추천 결과를 시간대별로 표시하는 컴포넌트
function RecommendationResults({ 
  recommendations, 
  timeSlots,
  isAdmin = false,
  userFeedbacks = {},
  userFavorites = {}
}: { 
  recommendations: RecommendationResponse;
  timeSlots: TimeSlot[];
  isAdmin?: boolean;
  userFeedbacks?: Record<number, UserFeedback[]>;
  userFavorites?: Record<number, boolean>;
}) {
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

// 스켈레톤 로딩 컴포넌트
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
      
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-purple-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">최적의 데이트 코스를 찾고 있어요...</span>
        </div>
      </div>
    </div>
  );
}

// 개별 장소 카드 컴포넌트
function PlaceCard({ 
  place, 
  rank, 
  userFeedbacks,
  isFavorite = false
}: { 
  place: PlaceWithTimeSlots; 
  rank: number;
  userFeedbacks?: UserFeedback[];
  isFavorite?: boolean;
}) {
  const fetcher = useFetcher();
  const prevFavoriteRef = useRef<boolean>(isFavorite);

  // 초기 피드백/즐겨찾기 상태 계산
  const initialFeedbackState = {
    like: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'like') || false,
    dislike: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'dislike') || false,
    visited: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'visited') || false,
  };

  // 로컬 상태: 즐겨찾기 & 피드백
  const [favorite, setFavorite] = useState<boolean>(isFavorite);
  const [feedbackState, setFeedbackState] = useState<typeof initialFeedbackState>(initialFeedbackState);

  // prop 변경(다른 장소로 카드 재사용 등) 시 상태 동기화
  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite, place.id]);

  useEffect(() => {
    setFeedbackState({
      like: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'like') || false,
      dislike: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'dislike') || false,
      visited: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'visited') || false,
    });
  }, [userFeedbacks, place.id]);

  // fetcher 결과에 따라 로컬 상태 업데이트
  useEffect(() => {
    if (fetcher.data && typeof fetcher.data === 'object') {
      if ('favoriteResult' in fetcher.data && fetcher.data.favoriteResult) {
        const result = fetcher.data.favoriteResult as { placeId: number; isFavorite: boolean };
        if (result.placeId === place.id) {
          setFavorite(result.isFavorite);
        }
      } else if ('error' in fetcher.data && fetcher.data.error) {
        // 서버 오류 시 롤백
        setFavorite(prevFavoriteRef.current);
      }

      if ('feedbackResult' in fetcher.data && fetcher.data.feedbackResult) {
        const result = fetcher.data.feedbackResult as { placeId: number; feedbackType: FeedbackType; isActive: boolean };
        if (result.placeId === place.id) {
          setFeedbackState(prev => ({
            ...prev,
            [result.feedbackType]: result.isActive,
          }));
        }
      }
    }
  }, [fetcher.data, place.id]);

  const hasFeedback = feedbackState.like || feedbackState.dislike || feedbackState.visited;
  const isSubmitting = fetcher.state === 'submitting';
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {place.place_images && place.place_images.length > 0 && (
        <img
          src={place.place_images[0].image_url}
          alt={place.place_images[0].alt_text || place.name || '장소 이미지'}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-purple-600">#{rank}</span>
              <h4 className="text-lg font-semibold text-gray-900">{place.name}</h4>
            </div>
            {place.categories && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {place.categories.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end text-sm text-gray-500">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐</span>
                <span className="ml-1">{place.rating || 'N/A'}</span>
              </div>
              {place.recommendationScore && (
                <div className="text-xs text-purple-600 mt-1">
                  추천 점수: {Math.round(place.recommendationScore)}
                </div>
              )}
            </div>
            
            {/* 즐겨찾기 버튼 */}
            <button
              onClick={() => {
                // Optimistic UI: 즉시 토글
                prevFavoriteRef.current = favorite;
                setFavorite(!favorite);
                fetcher.submit(
                  {
                    intent: 'favorite',
                    placeId: place.id.toString()
                  },
                  { method: 'post' }
                );
              }}
              disabled={isSubmitting}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                favorite 
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <svg 
                className="w-5 h-5" 
                fill={favorite ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
            </button>
          </div>
        </div>
        
        {place.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {place.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            {place.price_range && (
              <div className="flex items-center">
                <span>💰</span>
                <span className="ml-1">
                  {'₩'.repeat(Math.min(place.price_range, 4))}
                </span>
              </div>
            )}
            {place.groupSize && place.groupSize > 1 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {place.groupSize}개 등록
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {place.isPartnership && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                제휴
              </span>
            )}
            {place.sources?.includes('admin') && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                공식
              </span>
            )}
          </div>
        </div>
        
        {place.tags && place.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {place.tags.slice(0, 4).map((tag, index) => (
                <span key={index} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                  #{tag}
                </span>
              ))}
              {place.tags.length > 4 && (
                <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                  +{place.tags.length - 4}개 더
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* 추천 근거 상세 정보 */}
        {place.scoreBreakdown && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <details className="cursor-pointer group">
              <summary className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                <span>왜 이 장소를 추천했나요?</span>
                <svg className="w-3 h-3 transform group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="mt-2 space-y-1 pl-2">
                {place.scoreBreakdown.partnership > 0 && (
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <span className="w-4 text-center">🤝</span>
                    <span>제휴 업체</span>
                    <span className="font-medium">+{place.scoreBreakdown.partnership}점</span>
                  </div>
                )}
                {place.scoreBreakdown.rating > 0 && (
                  <div className="flex items-center gap-2 text-xs text-yellow-700">
                    <span className="w-4 text-center">⭐</span>
                    <span>평점 우수</span>
                    <span className="font-medium">+{place.scoreBreakdown.rating.toFixed(1)}점</span>
                  </div>
                )}
                {place.scoreBreakdown.timeSlot > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <span className="w-4 text-center">⏰</span>
                    <span>시간대 최적</span>
                    <span className="font-medium">+{place.scoreBreakdown.timeSlot}점</span>
                  </div>
                )}
                {place.scoreBreakdown.popularity > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-700">
                    <span className="w-4 text-center">🔥</span>
                    <span>인기 장소</span>
                    <span className="font-medium">+{place.scoreBreakdown.popularity}점</span>
                  </div>
                )}
                {place.scoreBreakdown.source > 0 && (
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <span className="w-4 text-center">✅</span>
                    <span>관리자 추천</span>
                    <span className="font-medium">+{place.scoreBreakdown.source}점</span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">총 추천 점수</span>
                    <span className="font-bold text-purple-600">{Math.round(place.recommendationScore || 0)}점</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        )}
        
        {/* 사용자 피드백 섹션 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {hasFeedback ? (
            <div className="text-center py-2">
              <div className="text-sm text-green-600 font-medium mb-1">
                피드백을 남겨주셔서 감사합니다! 💝
              </div>
              <div className="text-xs text-gray-500">
                {feedbackState.like && '좋아요를 눌러주셨네요 😊'}
                {feedbackState.dislike && '소중한 의견 감사합니다 🙏'}
                {feedbackState.visited && '방문 경험을 공유해주셔서 감사해요 ✨'}
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-600 mb-2">이 장소는 어떠셨나요?</div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    fetcher.submit(
                      {
                        intent: 'feedback',
                        placeId: place.id.toString(),
                        feedbackType: 'like'
                      },
                      { method: 'post' }
                    );
                    
                    // 버튼 위치에서 폭죽 효과
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                    const y = (rect.top + rect.height / 2) / window.innerHeight;
                    triggerCelebration('like', { origin: { x, y } });
                  }}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  } bg-gray-50 border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200`}
                >
                  <span>👍</span>
                  <span>좋아요</span>
                </button>
                
                <button
                  onClick={(e) => {
                    fetcher.submit(
                      {
                        intent: 'feedback',
                        placeId: place.id.toString(),
                        feedbackType: 'dislike'
                      },
                      { method: 'post' }
                    );
                    
                    // 별로예요는 작은 효과만
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                    const y = (rect.top + rect.height / 2) / window.innerHeight;
                    triggerCelebration('like', { origin: { x, y } });
                  }}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  } bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200`}
                >
                  <span>👎</span>
                  <span>별로예요</span>
                </button>
                
                <button
                  onClick={(e) => {
                    fetcher.submit(
                      {
                        intent: 'feedback',
                        placeId: place.id.toString(),
                        feedbackType: 'visited'
                      },
                      { method: 'post' }
                    );
                    
                    // 가봤어요는 성공 효과
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                    const y = (rect.top + rect.height / 2) / window.innerHeight;
                    triggerCelebration('success', { origin: { x, y } });
                  }}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  } bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200`}
                >
                  <span>📍</span>
                  <span>가봤어요</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


export const meta: MetaFunction = () => {
  return [
    { title: "코스모스 - 데이트 코스 추천 서비스" },
    { name: "description", content: "특별한 데이트 코스를 추천해드립니다" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  
  if (user) {
    // 캐싱된 API 호출로 rate limit 최적화
    const [regions, timeSlots] = await Promise.all([
      getRegions(request),
      getTimeSlots(request)
    ]);
    
    return json({ 
      user, 
      profile: null, 
      regions: regions as Tables<'regions'>[], 
      timeSlots: timeSlots as Tables<'time_slots'>[], 
      isAdmin: false, 
      error 
    });
  }
  
  return json({ 
    user, 
    profile: null, 
    regions: [] as Tables<'regions'>[], 
    timeSlots: [] as Tables<'time_slots'>[], 
    isAdmin: false, 
    error 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect(ROUTES.LOGIN);
  }

  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  // 즐겨찾기 처리
  if (intent === 'favorite') {
    const placeId = parseInt(formData.get('placeId') as string);

    if (!placeId) {
      return json({ 
        error: '장소 정보가 올바르지 않습니다.',
        recommendations: null,
        favoriteResult: null
      }, { status: 400 });
    }

    try {
      const result = await toggleFavorite(request, placeId);
      return json({ 
        error: null,
        recommendations: null,
        favoriteResult: {
          placeId,
          isFavorite: result.isFavorite
        }
      });
    } catch (error) {
      console.error('Favorite error:', error);
      return json({ 
        error: '즐겨찾기 처리 중 오류가 발생했습니다.',
        recommendations: null,
        favoriteResult: null
      }, { status: 500 });
    }
  }

  // 피드백 처리
  if (intent === 'feedback') {
    const placeId = parseInt(formData.get('placeId') as string);
    const feedbackType = formData.get('feedbackType') as FeedbackType;

    if (!placeId || !feedbackType) {
      return json({ 
        error: '피드백 정보가 올바르지 않습니다.',
        recommendations: null,
        feedbackResult: null
      }, { status: 400 });
    }

    try {
      const result = await toggleFeedback(request, placeId, feedbackType);
      return json({ 
        error: null,
        recommendations: null,
        feedbackResult: {
          placeId,
          feedbackType,
          isActive: result.action === 'created'
        }
      });
    } catch (error) {
      console.error('Feedback error:', error);
      return json({ 
        error: '피드백 처리 중 오류가 발생했습니다.',
        recommendations: null,
        feedbackResult: null
      }, { status: 500 });
    }
  }

  // 추천 요청 처리
  const regionId = parseInt(formData.get('regionId') as string);
  const date = formData.get('date') as string;
  const timeSlotIds = formData.getAll('timeSlots').map(id => parseInt(id as string));

  if (!regionId || !date || timeSlotIds.length === 0) {
    return json({ 
      error: '모든 필드를 입력해주세요.',
      recommendations: null,
      userFeedbacks: null,
      userFavorites: null
    }, { status: 400 });
  }

  try {
    const recommendations = await getAdvancedRecommendations(request, {
      regionId,
      date,
      timeSlotIds,
      maxResults: 12,
      diversityWeight: 0.3
    });

    // 추천 결과와 함께 사용자 피드백, 즐겨찾기 정보도 가져오기
    const placeIds = recommendations.places.map(place => place.id);
    const [userFeedbacks, userFavorites] = await Promise.all([
      getUserFeedbacksForPlaces(request, placeIds),
      getUserFavoritesForPlaces(request, placeIds)
    ]);

    return json({ 
      error: null,
      recommendations,
      userFeedbacks,
      userFavorites
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return json({ 
      error: '추천을 가져오는 중 오류가 발생했습니다.',
      recommendations: null,
      userFeedbacks: null,
      userFavorites: null
    }, { status: 500 });
  }
}

export default function Index() {
  const { user, regions, timeSlots, error, isAdmin: userIsAdmin } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isLoading = navigation.state === 'submitting';

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              코스모스
            </h1>
            <p className="text-xl text-white/90 mb-8">
              특별한 데이트 코스를 추천해드립니다
            </p>
            <div className="space-x-4">
              <Link to={ROUTES.LOGIN}>
                <Button size="lg" variant="white">
                  로그인
                </Button>
              </Link>
              <Link to={ROUTES.SIGNUP}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  회원가입
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error === 'auth_failed' && (
        <div className="bg-red-500 text-white text-center py-2">
          인증에 문제가 발생했습니다. 다시 로그인해주세요.
        </div>
      )}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">코스모스</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              안녕하세요, {(user.user_metadata as Record<string, unknown>)?.full_name as string || '사용자'}님!
            </span>
            <Link to={ROUTES.MY_PROFILE} className="relative">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="프로필"
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer">
                  <span className="text-lg text-purple-600">👤</span>
                </div>
              )}
              {user.app_metadata?.provider === 'kakao' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">K</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            오늘은 어떤 데이트를 해볼까요?
          </h2>
          <p className="text-gray-600 text-sm">
            지역과 시간을 선택하면 맞춤 데이트 코스를 추천해드려요
          </p>
        </div>

        {/* 추천 요청 폼 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <Form method="post" className="space-y-6">
            {actionData?.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            {/* 지역 선택 */}
            <div>
              <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-2">
                지역 선택 <span className="text-red-500">*</span>
              </label>
              <select
                id="regionId"
                name="regionId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">지역을 선택해주세요</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 선택 */}
            <Calendar
              name="date"
              label="데이트 날짜"
              required
              minDate={new Date()}
              helperText="오늘 이후 날짜를 선택해주세요"
            />

            {/* 시간대 선택 */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                희망 시간대 <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-2">(복수 선택 가능)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((timeSlot) => (
                  <label
                    key={timeSlot.id}
                    className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                    aria-label={`${timeSlot.name} 시간대 선택`}
                  >
                    <input
                      type="checkbox"
                      name="timeSlots"
                      value={timeSlot.id}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        {timeSlot.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeSlot.start_time} - {timeSlot.end_time}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  추천 중...
                </div>
              ) : (
                '맞춤 데이트 코스 추천받기 💕'
              )}
            </Button>
          </Form>
        </div>

        {/* 추천 결과 */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : actionData?.recommendations ? (
          <RecommendationResults 
            recommendations={actionData.recommendations as RecommendationResponse}
            timeSlots={timeSlots}
            isAdmin={userIsAdmin}
            userFeedbacks={actionData.userFeedbacks || {}}
            userFavorites={actionData.userFavorites || {}}
          />
        ) : null}
      </main>
    </div>
  );
}


