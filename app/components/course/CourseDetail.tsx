import type { DateCourse } from '~/types/course';
import { THEME_CONFIGS } from '~/types/course';
import { useState } from 'react';
import CourseMap from './CourseMap';

interface CourseDetailProps {
  course: DateCourse;
  showMap?: boolean;
  onClose?: () => void;
}

export function CourseDetail({ course, showMap = false, onClose }: CourseDetailProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'places' | 'info'>('timeline');
  const themeConfig = THEME_CONFIGS[course.theme as keyof typeof THEME_CONFIGS];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${mins}분`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatCost = (cost: { min: number; max: number }) => {
    const formatPrice = (price: number) => {
      if (price >= 10000) {
        return `${Math.round(price / 1000)}만원`;
      }
      return `${Math.round(price / 1000)}천원`;
    };

    if (cost.min === cost.max) {
      return formatPrice(cost.min);
    }
    return `${formatPrice(cost.min)}~${formatPrice(cost.max)}`;
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM 형태로 변환
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '보통';
    }
  };

  const renderTimelineView = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          📅 데이트 타임라인
        </h3>
        <p className="text-sm text-gray-600">
          총 {formatDuration(course.totalDuration)} 소요 예정
        </p>
      </div>

      <div className="relative">
        {/* 타임라인 선 */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-200 via-purple-300 to-purple-200"></div>
        
        {course.places.map((placeInfo, index) => (
          <div key={placeInfo.place.id} className="relative flex gap-4 mb-8 last:mb-0">
            {/* 타임라인 포인트 */}
            <div className="relative z-10 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {index + 1}
            </div>
            
            {/* 장소 정보 */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {placeInfo.place.name}
                  </h4>
                  <p className="text-sm text-purple-600 mb-2">
                    {formatTime(placeInfo.timeSlot.start_time)} - {formatTime(placeInfo.timeSlot.end_time)} ({placeInfo.timeSlot.name})
                  </p>
                </div>
                {placeInfo.place.categories && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {placeInfo.place.categories.name}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span className="text-gray-600">
                    체류 {formatDuration(placeInfo.suggestedDuration)}
                  </span>
                </div>
                
                {placeInfo.place.rating && (
                  <div className="flex items-center gap-2">
                    <span>⭐</span>
                    <span className="text-gray-600">
                      {placeInfo.place.rating}점
                    </span>
                  </div>
                )}
                
                {placeInfo.place.price_range && (
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span className="text-gray-600">
                      {'💰'.repeat(placeInfo.place.price_range)}
                    </span>
                  </div>
                )}
                
                {placeInfo.distanceFromPrevious && (
                  <div className="flex items-center gap-2">
                    <span>🚶‍♀️</span>
                    <span className="text-gray-600">
                      이전 장소에서 {formatDistance(placeInfo.distanceFromPrevious)}
                    </span>
                  </div>
                )}
              </div>
              
              {placeInfo.travelTimeFromPrevious && index > 0 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span>🚗</span>
                    <span>이전 장소에서 약 {placeInfo.travelTimeFromPrevious}분 소요</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlacesView = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          📍 포함된 장소들
        </h3>
        <p className="text-sm text-gray-600">
          총 {course.places.length}개 장소
        </p>
      </div>

      {course.places.map((placeInfo, index) => (
        <div key={placeInfo.place.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2">
                {placeInfo.place.name}
              </h4>
              
              {placeInfo.place.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {placeInfo.place.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">⏰</span>
                  <span className="text-gray-600">
                    {formatTime(placeInfo.timeSlot.start_time)}-{formatTime(placeInfo.timeSlot.end_time)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">📍</span>
                  <span className="text-gray-600">
                    {placeInfo.timeSlot.name}
                  </span>
                </div>
                
                {placeInfo.place.rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">⭐</span>
                    <span className="text-gray-600">
                      {placeInfo.place.rating}점
                    </span>
                  </div>
                )}
                
                {placeInfo.place.categories && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">🏷️</span>
                    <span className="text-gray-600">
                      {placeInfo.place.categories.name}
                    </span>
                  </div>
                )}
              </div>
              
              {placeInfo.place.tags && placeInfo.place.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {placeInfo.place.tags.slice(0, 4).map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {placeInfo.place.tags.length > 4 && (
                    <span className="text-xs text-gray-400">+{placeInfo.place.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInfoView = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          ℹ️ 코스 정보
        </h3>
      </div>

      {/* 코스 지도 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🗺️</span>
          코스 경로
        </h5>
        <CourseMap 
          places={course.places}
          height="320px"
          className="rounded-xl"
        />
        <div className="mt-3 text-sm text-gray-600">
          <p>💡 지도에서 코스 순서대로 번호가 표시됩니다</p>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{themeConfig?.icon || '📍'}</span>
          <div>
            <h4 className="text-xl font-bold text-gray-800">{course.name}</h4>
            <p className="text-gray-600">{themeConfig?.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">총 소요시간:</span>
              <span className="font-medium">{formatDuration(course.totalDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">총 이동거리:</span>
              <span className="font-medium">{formatDistance(course.totalDistance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예상 비용:</span>
              <span className="font-medium">{formatCost(course.estimatedCost)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">이동 난이도:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                {getDifficultyText(course.difficulty)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">날씨 적합성:</span>
              <span className="font-medium">
                {course.weatherSuitability === 'indoor' ? '실내 중심' : 
                 course.weatherSuitability === 'outdoor' ? '실외 중심' : '실내외 혼합'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">포함 장소:</span>
              <span className="font-medium">{course.places.length}곳</span>
            </div>
          </div>
        </div>
      </div>

      {/* 코스 태그 */}
      {course.tags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h5 className="font-semibold text-gray-800 mb-3">🏷️ 코스 특징</h5>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag, index) => (
              <span key={index} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <h5 className="font-semibold text-purple-800 mb-3">💡 코스 팁</h5>
        <ul className="space-y-2 text-sm text-purple-700">
          <li>• 각 장소의 권장 체류 시간을 참고하여 일정을 조정하세요</li>
          <li>• 이동 시간은 도보/대중교통 기준으로 계산되었습니다</li>
          <li>• 날씨나 교통 상황에 따라 일정이 변경될 수 있습니다</li>
          <li>• 예상 비용은 평균적인 가격대를 기준으로 한 추정치입니다</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold mb-2">{course.name}</h3>
            <p className="text-purple-100 mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span>⏱️ {formatDuration(course.totalDuration)}</span>
              <span>💰 {formatCost(course.estimatedCost)}</span>
              <span>📍 {course.places.length}곳</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'timeline', label: '타임라인', icon: '📅' },
            { key: 'places', label: '장소 목록', icon: '📍' },
            { key: 'info', label: '코스 정보', icon: 'ℹ️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-6">
        {activeTab === 'timeline' && renderTimelineView()}
        {activeTab === 'places' && renderPlacesView()}
        {activeTab === 'info' && renderInfoView()}
      </div>
    </div>
  );
}