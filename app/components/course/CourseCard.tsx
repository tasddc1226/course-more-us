import type { DateCourse } from '~/types/course';
import { THEME_CONFIGS } from '~/types/course';

interface CourseCardProps {
  course: DateCourse;
  onClick: () => void;
  isSelected?: boolean;
}

export function CourseCard({ course, onClick, isSelected = false }: CourseCardProps) {
  const themeConfig = THEME_CONFIGS[course.theme as keyof typeof THEME_CONFIGS];
  
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

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'indoor': return '🏠';
      case 'outdoor': return '🌤️';
      case 'mixed': return '🌦️';
      default: return '☁️';
    }
  };

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

  return (
    <div
      onClick={onClick}
      className={`
        relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300
        hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500
        ${isSelected 
          ? 'border-purple-500 bg-purple-50 shadow-lg scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-purple-300'
        }
      `}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* 선택 상태 표시 */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{themeConfig?.icon || '📍'}</span>
            <h3 className={`text-lg font-bold ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
              {course.name}
            </h3>
          </div>
          {/* 선택 상태가 아닐 때만 우상단에 난이도 표시 */}
          {!isSelected && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
              {getDifficultyText(course.difficulty)}
            </div>
          )}
        </div>
        
        {/* 선택 상태일 때 난이도를 제목 아래로 이동 */}
        {isSelected && (
          <div className="flex items-center gap-2 mb-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
              {getDifficultyText(course.difficulty)}
            </div>
            <span className="text-xs text-purple-600">• 체크된 코스</span>
          </div>
        )}
        
        <p className={`text-sm mb-3 ${isSelected ? 'text-purple-600' : 'text-gray-600'}`}>
          {themeConfig?.description || course.description}
        </p>
      </div>

      {/* 장소 미리보기 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">포함 장소</span>
          <span className={`text-xs px-2 py-1 rounded-full ${isSelected ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
            {course.places.length}곳
          </span>
        </div>
        
        <div className="space-y-1">
          {course.places.slice(0, 3).map((placeInfo, index) => (
            <div key={placeInfo.place.id} className="flex items-center gap-2 text-sm">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                isSelected ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {index + 1}
              </span>
              <span className={isSelected ? 'text-purple-700' : 'text-gray-700'}>
                {placeInfo.place.name}
              </span>
              <span className="text-xs text-gray-400">
                ({formatDuration(placeInfo.suggestedDuration)})
              </span>
            </div>
          ))}
          
          {course.places.length > 3 && (
            <div className="text-xs text-gray-500 mt-1 pl-7">
              외 {course.places.length - 3}곳 더...
            </div>
          )}
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏱️</span>
          <div>
            <div className="text-xs text-gray-500">총 소요시간</div>
            <div className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
              {formatDuration(course.totalDuration)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <div>
            <div className="text-xs text-gray-500">예상 비용</div>
            <div className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
              {formatCost(course.estimatedCost)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">🚶‍♀️</span>
          <div>
            <div className="text-xs text-gray-500">이동 거리</div>
            <div className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
              {formatDistance(course.totalDistance)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{getWeatherIcon(course.weatherSuitability)}</span>
          <div>
            <div className="text-xs text-gray-500">날씨 적합성</div>
            <div className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
              {course.weatherSuitability === 'indoor' ? '실내' : 
               course.weatherSuitability === 'outdoor' ? '실외' : '실내외'}
            </div>
          </div>
        </div>
      </div>

      {/* 태그 */}
      {course.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {course.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-full ${
                isSelected 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              #{tag}
            </span>
          ))}
          {course.tags.length > 4 && (
            <span className="text-xs text-gray-400">+{course.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* 선택 유도 텍스트 */}
      <div className="mt-4 text-center">
        <span className={`text-sm font-medium ${
          isSelected ? 'text-purple-600' : 'text-gray-500'
        }`}>
          {isSelected ? '선택된 코스입니다' : '클릭하여 상세보기'}
        </span>
      </div>
    </div>
  );
}