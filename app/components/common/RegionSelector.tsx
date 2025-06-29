import { useState, useEffect, useRef } from 'react';

interface Region {
  id: number;
  name: string;
  slug: string;
  description?: string;
  match_score?: number;
}

interface RegionSelectorProps {
  selectedRegion?: Region | null;
  onRegionSelect: (region: Region | null) => void;
  placeholder?: string;
  className?: string;
}

export function RegionSelector({
  selectedRegion,
  onRegionSelect,
  placeholder = "지역을 선택하세요",
  className = ""
}: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 지역 검색
  const searchRegions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setLoading(true);
      try {
        const response = await fetch('/api/regions/search');
        const data = await response.json();
        if (data.success) {
          setRegions(data.data);
          setShowPopular(true);
        }
      } catch (error) {
        console.error('Failed to fetch popular regions:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/regions/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setRegions(data.data);
        setShowPopular(false);
      }
    } catch (error) {
      console.error('Failed to search regions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 드롭다운 열기 시 인기 지역 로드
  const handleOpen = () => {
    setIsOpen(true);
    if (regions.length === 0) {
      searchRegions('');
    }
  };

  // 검색어 입력 처리
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchRegions(value);
  };

  // 지역 선택 처리
  const handleRegionSelect = (region: Region) => {
    onRegionSelect(region);
    setIsOpen(false);
    setQuery('');
  };

  // 전체 지역 선택 (필터 제거)
  const handleAllRegions = () => {
    onRegionSelect(null);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 선택된 지역 표시 버튼 */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
          isOpen ? 'ring-2 ring-purple-500' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📍</span>
            <span className="text-white">
              {selectedRegion ? selectedRegion.name : placeholder}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-80 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
                             <input
                 type="text"
                 value={query}
                 onChange={handleQueryChange}
                 placeholder="지역 검색..."
                 className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
               />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 검색 결과 */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                검색 중...
              </div>
            ) : (
              <>
                {/* 전체 지역 옵션 */}
                <button
                  type="button"
                  onClick={handleAllRegions}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    !selectedRegion ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">🌍</span>
                  <div>
                    <div className="font-medium">전체 지역</div>
                    <div className="text-sm text-gray-500">지역 제한 없이 검색</div>
                  </div>
                </button>

                {/* 구분선 */}
                <div className="border-t border-gray-200"></div>

                {/* 지역 목록 */}
                {regions.length > 0 ? (
                  <>
                    {showPopular && (
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                        인기 지역
                      </div>
                    )}
                    {regions.map((region) => (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => handleRegionSelect(region)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                          selectedRegion?.id === region.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-lg">📍</span>
                        <div className="flex-1">
                          <div className="font-medium">{region.name}</div>
                          {region.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {region.description}
                            </div>
                          )}
                        </div>
                        {region.match_score && region.match_score > 90 && (
                          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            정확
                          </div>
                        )}
                      </button>
                    ))}
                  </>
                ) : !loading && query ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                                         <div>{query}에 대한 지역을 찾을 수 없습니다</div>
                    <div className="text-sm mt-1">다른 검색어를 시도해보세요</div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 