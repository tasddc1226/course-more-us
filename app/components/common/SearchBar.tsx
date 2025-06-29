import { Form, useNavigation, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "~/utils/cn";

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
  showTagSuggestions?: boolean;
  showPopularTags?: boolean;
}

interface TagSuggestion {
  tag: string;
  count?: number;
}

export default function SearchBar({ 
  initialQuery = "", 
  className,
  showTagSuggestions = true,
  showPopularTags = true
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [popularTags, setPopularTags] = useState<TagSuggestion[]>([]);
  const [hasLoadedPopularTags, setHasLoadedPopularTags] = useState(false);
  
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const isSubmitting = navigation.state === "submitting";

  // 인기 태그 지연 로드 함수
  const loadPopularTags = () => {
    if (showPopularTags && !hasLoadedPopularTags) {
      fetcher.load('/api/tags/popular');
      setHasLoadedPopularTags(true);
    }
  };

  // 인기 태그 데이터 업데이트
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = fetcher.data as any;
    if (data && data.popularTags) {
      setPopularTags(data.popularTags);
      // 검색창이 포커스되어 있고 검색어가 없으면 인기 태그 표시
      if (document.activeElement === inputRef.current && !query) {
        setShowSuggestions(true);
      }
    }
  }, [fetcher.data, query]);

  // 태그 자동완성 요청 (디바운스 적용)
  useEffect(() => {
    if (query.length >= 1 && showTagSuggestions) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/api/tags/suggestions?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions.map((tag: string) => ({ tag })));
          }
        } catch (error) {
          console.error('Error fetching tag suggestions:', error);
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [query, showTagSuggestions]);

  // 외부 클릭 시 자동완성 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (tag: string) => {
    setQuery(tag);
    setShowSuggestions(false);
    // 자동으로 검색 실행
    const form = inputRef.current?.closest('form');
    if (form) {
      setTimeout(() => form.requestSubmit(), 100);
    }
  };

  const handleInputFocus = () => {
    // 인기 태그 지연 로딩 - 사용자가 검색창에 포커스했을 때만 로드
    loadPopularTags();
    
    // 검색어가 있거나 이미 인기 태그가 로드되어 있으면 자동완성 표시
    if (query.length > 0 || popularTags.length > 0 || hasLoadedPopularTags) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const displaySuggestions = showSuggestions && (suggestions.length > 0 || (popularTags.length > 0 && !query));

  return (
    <div className={cn("relative w-full", className)}>
      <Form
        method="get"
        action="/search"
        className="relative"
      >
        <div className="relative">
          {/* 검색 아이콘 */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            name="q"
            required
            placeholder="장소명, 태그, 지역을 검색하세요"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-16 py-4 text-gray-900 placeholder-gray-500 bg-white border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:shadow-xl transition-all duration-200"
          />
          
          {/* 검색 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting || query.trim().length === 0}
            className="absolute inset-y-0 right-0 pr-2 flex items-center"
          >
            <div className={cn(
              "px-4 py-2 rounded-xl text-white font-medium transition-all duration-200",
              query.trim().length === 0 || isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:scale-105"
            )}>
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "검색"
              )}
            </div>
          </button>
        </div>
      </Form>

      {/* 자동완성 및 인기 태그 */}
      {displaySuggestions && (
        <div
          ref={suggestionRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border-0 rounded-2xl shadow-2xl z-20 max-h-80 overflow-y-auto"
        >
          {/* 자동완성 결과 */}
          {suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 bg-gray-50 rounded-t-2xl">
                💡 태그 추천
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion.tag)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition-colors group"
                >
                  <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
                    <span className="text-purple-600 text-sm">#</span>
                  </div>
                  <span className="text-gray-900 font-medium">{suggestion.tag}</span>
                </button>
              ))}
            </div>
          )}

          {/* 인기 태그 */}
          {popularTags.length > 0 && !query && (
            <div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 bg-gray-50">
                🔥 인기 태그
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 12).map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(tag.tag)}
                      className="group px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-full transition-all duration-200 hover:shadow-md transform hover:scale-105"
                    >
                      <span className="text-sm font-medium">#{tag.tag}</span>
                      {tag.count && (
                        <span className="ml-1 text-xs text-purple-500 group-hover:text-purple-600">
                          ({tag.count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}