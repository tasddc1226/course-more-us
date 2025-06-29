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
  
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const isSubmitting = navigation.state === "submitting";

  // 인기 태그 로드
  useEffect(() => {
    if (showPopularTags) {
      fetcher.load('/api/tags/popular');
    }
  }, [showPopularTags, fetcher]);

  // 인기 태그 데이터 업데이트
  useEffect(() => {
    if (fetcher.data && fetcher.data.popularTags) {
      setPopularTags(fetcher.data.popularTags);
    }
  }, [fetcher.data]);

  // 태그 자동완성 요청
  useEffect(() => {
    if (query.length >= 1 && showTagSuggestions) {
      const timeoutId = setTimeout(() => {
        fetcher.load(`/api/tags/suggestions?q=${encodeURIComponent(query)}`);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [query, showTagSuggestions, fetcher]);

  // 자동완성 데이터 업데이트
  useEffect(() => {
    if (fetcher.data && fetcher.data.suggestions) {
      setSuggestions(fetcher.data.suggestions.map((tag: string) => ({ tag })));
    }
  }, [fetcher.data]);

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
    if (query.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const displaySuggestions = showSuggestions && (suggestions.length > 0 || popularTags.length > 0);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Form
        method="get"
        action="/search"
        className="flex items-center w-full"
      >
        <input
          ref={inputRef}
          type="text"
          name="q"
          required
          placeholder="장소, 태그, 지역을 검색하세요"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting || query.trim().length === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
        >
          검색
        </button>
      </Form>

      {/* 자동완성 및 인기 태그 */}
      {displaySuggestions && (
        <div
          ref={suggestionRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto"
        >
          {/* 자동완성 결과 */}
          {suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                태그 추천
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion.tag)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                >
                  <span className="text-purple-600">#</span>
                  <span>{suggestion.tag}</span>
                </button>
              ))}
            </div>
          )}

          {/* 인기 태그 */}
          {popularTags.length > 0 && !query && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                인기 태그
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 12).map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(tag.tag)}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      #{tag.tag}
                      {tag.count && (
                        <span className="ml-1 text-purple-500">({tag.count})</span>
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