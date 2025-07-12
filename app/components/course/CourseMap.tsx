import { useEffect, useRef, useState } from 'react';
import type { CoursePlaceInfo } from '~/types/course';
import { loadKakaoMapSDK } from '~/lib/kakao-map.client';

interface CourseMapProps {
  places: CoursePlaceInfo[];
  height?: string;
  className?: string;
}

export default function CourseMap({ 
  places, 
  height = '320px', 
  className = '' 
}: CourseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 카카오 지도 SDK 로드
        await loadKakaoMapSDK();

        if (!mapRef.current || places.length === 0) {
          return;
        }

        // 첫 번째 장소를 중심으로 설정
        const centerLat = places[0].place.latitude;
        const centerLng = places[0].place.longitude;

        // 지도 생성
        const mapOptions = {
          center: new window.kakao.maps.LatLng(centerLat, centerLng),
          level: 5
        };

        const map = new window.kakao.maps.Map(mapRef.current, mapOptions);

        // 각 장소에 마커 추가
        places.forEach((placeInfo, index) => {
          const position = new window.kakao.maps.LatLng(
            placeInfo.place.latitude,
            placeInfo.place.longitude
          );

          // 커스텀 마커 생성
          const markerContent = `
            <div style="
              background: #8B5CF6;
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              min-width: 24px;
              text-align: center;
              position: relative;
            ">
              ${index + 1}
              <div style="
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 8px solid #8B5CF6;
              "></div>
            </div>
          `;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: markerContent,
            yAnchor: 1
          });

          customOverlay.setMap(map);

          // 인포윈도우 생성
          const infoContent = `
            <div style="
              padding: 10px 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border: 1px solid #e5e7eb;
              min-width: 200px;
            ">
              <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">
                ${index + 1}. ${placeInfo.place.name}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                ${placeInfo.timeSlot.name} (${placeInfo.timeSlot.start_time.slice(0, 5)} - ${placeInfo.timeSlot.end_time.slice(0, 5)})
              </div>
              <div style="font-size: 12px; color: #8b5cf6;">
                체류시간: ${Math.floor(placeInfo.suggestedDuration / 60)}시간 ${placeInfo.suggestedDuration % 60}분
              </div>
            </div>
          `;

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: infoContent
          });

          // 마커 클릭 시 인포윈도우 표시/숨김
          window.kakao.maps.event.addListener(customOverlay, 'click', () => {
            infoWindow.open(map, position);
          });
        });

        // 모든 마커가 보이도록 지도 범위 조정
        if (places.length > 1) {
          const bounds = new window.kakao.maps.LatLngBounds();
          places.forEach(placeInfo => {
            bounds.extend(new window.kakao.maps.LatLng(
              placeInfo.place.latitude,
              placeInfo.place.longitude
            ));
          });
          map.setBounds(bounds);
        }

      } catch (error) {
        console.error('지도 초기화 실패:', error);
        setError('지도를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [places]);

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`bg-red-50 border border-red-200 rounded-lg flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div 
        className={`bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">표시할 장소가 없습니다</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden border border-gray-300 ${className}`} 
      style={{ height }}
    />
  );
} 