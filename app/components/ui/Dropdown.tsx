import { useState, useEffect, useRef } from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue?: string | number | null;
  onSelect: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
  variant?: 'default' | 'purple' | 'blue';
  loading?: boolean;
  disabled?: boolean;
  maxHeight?: string;
}

export function Dropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = "선택하세요",
  label,
  required,
  error,
  helperText,
  searchable = false,
  allowClear = false,
  clearLabel = "전체",
  className = "",
  variant = "default",
  loading = false,
  disabled = false,
  maxHeight = "max-h-64"
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 선택된 옵션 찾기
  const selectedOption = options.find(option => option.value === selectedValue);

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

  // 검색 필터링
  useEffect(() => {
    if (!searchable || !query.trim()) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      option.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [options, query, searchable]);

  // 드롭다운 열기/닫기
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // 옵션 선택
  const handleOptionSelect = (value: string | number) => {
    onSelect(value);
    setIsOpen(false);
    setQuery('');
  };

  // 전체 선택 (클리어)
  const handleClear = () => {
    onSelect(null);
    setIsOpen(false);
    setQuery('');
  };

  // 검색어 입력 처리
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // 변형별 스타일
  const getVariantStyles = () => {
    switch (variant) {
      case 'purple':
        return {
          button: 'bg-white/10 backdrop-blur-sm border-white/20 text-white focus:ring-purple-500',
          dropdown: 'bg-white border-gray-200',
          option: 'hover:bg-purple-50 text-gray-700',
          selected: 'bg-purple-50 text-purple-700'
        };
      case 'blue':
        return {
          button: 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-blue-500 focus:border-blue-500',
          dropdown: 'bg-white border-gray-200',
          option: 'hover:bg-blue-50 text-gray-700',
          selected: 'bg-blue-50 text-blue-700'
        };
      default:
        return {
          button: 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-blue-500 focus:border-blue-500',
          dropdown: 'bg-white border-gray-200',
          option: 'hover:bg-gray-50 text-gray-700',
          selected: 'bg-gray-50 text-gray-900'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* 라벨 */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl text-left transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${styles.button}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedOption?.icon && (
              <span className="text-lg">{selectedOption.icon}</span>
            )}
            <div className="flex-1">
              <span className={selectedOption ? '' : 'text-gray-500'}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.description && (
                <div className="text-sm text-gray-500 mt-0.5">
                  {selectedOption.description}
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full"></div>
          ) : (
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              } ${variant === 'purple' ? 'text-white/70' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className={`
          absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-50 overflow-hidden
          ${styles.dropdown}
        `}>
          {/* 검색 입력 */}
          {searchable && (
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="검색..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          )}

          {/* 옵션 목록 */}
          <div className={`${maxHeight} overflow-y-auto`}>
            {/* 전체 선택 옵션 */}
            {allowClear && (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className={`
                    w-full px-4 py-3 text-left transition-colors flex items-center space-x-3
                    ${!selectedValue ? styles.selected : styles.option}
                  `}
                >
                  <span className="text-lg">🌍</span>
                  <div>
                    <div className="font-medium">{clearLabel}</div>
                    <div className="text-sm text-gray-500">모든 옵션 포함</div>
                  </div>
                </button>
                <div className="border-t border-gray-200"></div>
              </>
            )}

            {/* 옵션들 */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  disabled={option.disabled}
                  className={`
                    w-full px-4 py-3 text-left transition-colors flex items-center space-x-3
                    ${selectedValue === option.value ? styles.selected : styles.option}
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {option.icon && (
                    <span className="text-lg">{option.icon}</span>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchable && query ? '검색 결과가 없습니다.' : '옵션이 없습니다.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* 도움말 텍스트 */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
} 