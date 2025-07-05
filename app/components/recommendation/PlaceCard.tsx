import { useState, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import { triggerCelebration } from "~/components/ui";
import type { PlaceWithTimeSlots, FeedbackState } from "~/types/recommendation";
import type { FeedbackType, UserFeedback } from "~/lib/feedback.server";

interface PlaceCardProps {
  place: PlaceWithTimeSlots;
  rank: number;
  userFeedbacks?: UserFeedback[];
  isFavorite?: boolean;
}

export function PlaceCard({ 
  place, 
  rank, 
  userFeedbacks = [],
  isFavorite = false
}: PlaceCardProps) {
  const fetcher = useFetcher();
  const prevFavoriteRef = useRef<boolean>(isFavorite);

  // 초기 피드백/즐겨찾기 상태 계산
  const initialFeedbackState: FeedbackState = {
    like: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'like') || false,
    dislike: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'dislike') || false,
    visited: userFeedbacks?.some(f => f.place_id === place.id && f.feedback_type === 'visited') || false,
  };

  // 로컬 상태: 즐겨찾기 & 피드백
  const [favorite, setFavorite] = useState<boolean>(isFavorite);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(initialFeedbackState);

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