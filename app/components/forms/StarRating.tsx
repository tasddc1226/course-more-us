import { useState, useEffect, useRef } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function StarRating({ 
  value, 
  onChange, 
  size = 'md', 
  disabled = false,
  className = '' 
}: StarRatingProps) {
  const [rating, setRating] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRating(value);
  }, [value]);

  const handleRatingChange = (newRating: number) => {
    if (disabled) return;
    setRating(newRating);
    onChange(newRating);
  };

  const calculateRatingFromPosition = (clientX: number): number => {
    if (!containerRef.current) return 0;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const starWidth = width / 5;
    
    const starIndex = Math.floor(x / starWidth) + 1;
    const positionInStar = (x % starWidth) / starWidth;
    
    // 별의 왼쪽 절반이면 0.5, 오른쪽 절반이면 1점
    const rating = positionInStar < 0.5 ? starIndex - 0.5 : starIndex;
    
    return Math.max(0.5, Math.min(5, rating));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    const newRating = calculateRatingFromPosition(e.clientX);
    handleRatingChange(newRating);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const newRating = calculateRatingFromPosition(e.clientX);
    
    if (isDragging) {
      handleRatingChange(newRating);
    } else {
      setHoverRating(newRating);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverRating(null);
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-lg';
      case 'lg': return 'text-3xl';
      default: return 'text-2xl';
    }
  };

  // 현재 표시할 평점 (드래그 중이거나 호버 중일 때는 해당 값을 사용)
  const displayRating = isDragging ? rating : (hoverRating !== null ? hoverRating : rating);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        handleRatingChange(Math.max(0.5, rating - 0.5));
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleRatingChange(Math.min(5, rating + 0.5));
        break;
      case 'Home':
        e.preventDefault();
        handleRatingChange(0.5);
        break;
      case 'End':
        e.preventDefault();
        handleRatingChange(5);
        break;
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`flex items-center space-x-1 select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      role="slider"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={rating}
      aria-label="별점 선택"
      tabIndex={disabled ? -1 : 0}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFullStar = displayRating >= starIndex;
        const isHalfStar = displayRating === starIndex - 0.5;
        
        return (
          <div key={starIndex} className="relative inline-block">
            {/* 전체 별 배경 (회색) */}
            <span className={`${getSizeClass()} text-gray-300`}>★</span>
            
            {/* 채워진 별 표시 */}
            {isHalfStar && (
              <span 
                className={`absolute top-0 left-0 ${getSizeClass()} text-yellow-400 pointer-events-none overflow-hidden`}
                style={{ width: '50%' }}
              >
                ★
              </span>
            )}
            
            {isFullStar && (
              <span className={`absolute top-0 left-0 ${getSizeClass()} text-yellow-400 pointer-events-none`}>
                ★
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}